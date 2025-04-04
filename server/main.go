package main

import (
	"common"
	"encoding/base64"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net"
	"net/http"
	"server/payment"
	"server/proxy"
	"sync"
	"sync/atomic"
	"time"
)

var (
	clients     = make(map[string]*WebSocketClient)
	clientMutex sync.RWMutex
	nextID      int
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

// WebSocketClient represents a connected WebSocket client
type WebSocketClient struct {
	id         string
	conn       *websocket.Conn
	mutex      sync.Mutex
	socksConns map[string]*SocksConn
	socksMutex sync.Mutex
	respChans  map[string]chan Message
	respMutex  sync.Mutex
	lastPing   time.Time
	latency    time.Duration
	metrics    *Metrics
	stats      *ClientStats
}

type Message = common.Message

// SocksConn holds the SOCKS5 connection and its data channel
type SocksConn struct {
	id       string
	conn     net.Conn
	dataChan chan []byte
}

func main() {
	http.HandleFunc("/ws", wsHandler)
	http.HandleFunc("/stats", statsHandler)
	http.HandleFunc("/search", statsHandler)

	payment.Main()

	go http.ListenAndServe(":8080", nil)

	listener, err := net.Listen("tcp", ":1080")
	if err != nil {
		log.Fatal(err)
	}
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Println(err)
			continue
		}
		go handleSocksConn(conn)
	}
}

func wsHandler(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}

	clientID := r.RemoteAddr
	log.Printf("New WebSocket client connected: %s", clientID)

	if clients[clientID] != nil {
		http.Error(w, "A client with your IP address is already connected to the network", http.StatusConflict)
		return
	}

	client := &WebSocketClient{
		id:         clientID,
		conn:       c,
		socksConns: make(map[string]*SocksConn),
		respChans:  make(map[string]chan Message),
		metrics: &Metrics{
			LatencyReport: make([]int16, 0, 10)},
		stats: &ClientStats{
			connectTime: time.Now(),
			bitcoinAddr: "not_set",
		},
	}

	clientMutex.Lock()
	clients[clientID] = client
	clientMutex.Unlock()

	go wsReader(client)
}

func wsReader(client *WebSocketClient) {
	defer func() {
		clientMutex.Lock()
		delete(clients, client.id)
		clientMutex.Unlock()

		client.conn.Close()
		log.Println("Closed client", client.id)
	}()

	for {
		var msg Message
		err := client.conn.ReadJSON(&msg)
		if err != nil {
			log.Println("ReadJSON error:", err)
			return
		}
		switch msg.Type {
		case "connect_response":
			client.respMutex.Lock()
			if ch, ok := client.respChans[msg.ID]; ok {
				ch <- msg
				delete(client.respChans, msg.ID)
			}
			client.respMutex.Unlock()
		case "data":
			client.socksMutex.Lock()
			if sc, ok := client.socksConns[msg.ID]; ok {
				if data, err := base64.StdEncoding.DecodeString(msg.Data); err == nil {
					dataSize := uint64(len(data))
					atomic.AddUint64(&client.stats.bytesReceived, dataSize)

					sc.dataChan <- data
				}
			}
			client.socksMutex.Unlock()
		case "close":
			client.socksMutex.Lock()
			if sc, ok := client.socksConns[msg.ID]; ok {
				sc.conn.Close()
				delete(client.socksConns, msg.ID)
			}
			client.socksMutex.Unlock()
		case "address":
			client.stats.bitcoinAddr = msg.ID
			go client.ping()
		case "pong":
			if time.Since(client.lastPing).Seconds() > 30 {
				client.conn.Close()
				// TODO: proper Timeout
				// TODO: proper close handling
			}
			client.pong(int16(time.Since(client.lastPing).Milliseconds()))
		}
	}
}

func handleSocksConn(conn net.Conn) {
	defer conn.Close()

	host, port, err := proxy.HandleSocksHandshake(conn)

	if err != nil {
		log.Println("Failed parsing and handling initial SOCKS handshake", err)
		return
	}

	client := findAvailableClient()
	if client == nil {
		log.Println("No active WebSocket clients available")
		return
	}
	// Assign ID and set up connection
	client.mutex.Lock()
	id := fmt.Sprintf("%d", nextID)
	nextID++
	client.mutex.Unlock()

	dataChan := make(chan []byte, 100)
	sc := &SocksConn{
		id:       id,
		conn:     conn,
		dataChan: dataChan,
	}

	client.socksMutex.Lock()
	client.socksConns[id] = sc
	client.socksMutex.Unlock()

	atomic.AddInt32(&client.stats.activeConns, 1)

	// Send CONNECT request over WebSocket
	msg := Message{Type: "connect", ID: id, Host: host, Port: port}
	client.mutex.Lock()

	err = client.conn.WriteJSON(msg)
	client.mutex.Unlock()
	if err != nil {
		log.Println("WriteJSON error:", err)
		return
	}

	// Wait for connect response
	respChan := make(chan Message)
	client.respMutex.Lock()
	client.respChans[id] = respChan
	client.respMutex.Unlock()
	respMsg := <-respChan
	if respMsg.Status == "success" {
		// Send SOCKS5 success reply
		_, err = conn.Write([]byte{5, 0, 0, 1, 0, 0, 0, 0, 0, 0})
		if err != nil {
			log.Println(err)
			sendCloseMessage(client, id)
			return
		}
		go relayFromSocksToWS(client, sc, id)
		relayFromChanToSocks(client, sc, id)
	} else {
		// Send SOCKS5 failure reply
		conn.Write([]byte{5, 1, 0, 1, 0, 0, 0, 0, 0, 0})
		sendCloseMessage(client, id)
	}
}

func relayFromSocksToWS(client *WebSocketClient, sc *SocksConn, id string) {
	buf := make([]byte, 4096)
	for {
		n, err := sc.conn.Read(buf)
		if err != nil {
			sendCloseMessage(client, id)
			return
		}

		dataSize := uint64(n)
		atomic.AddUint64(&client.stats.bytesSent, dataSize)

		data := base64.StdEncoding.EncodeToString(buf[:n])
		msg := Message{Type: "data", ID: id, Data: data}
		client.mutex.Lock()
		if client.conn != nil {
			client.conn.WriteJSON(msg)
		}
		client.mutex.Unlock()
	}
}

func relayFromChanToSocks(client *WebSocketClient, sc *SocksConn, id string) {
	for data := range sc.dataChan {
		_, err := sc.conn.Write(data)
		if err != nil {
			sendCloseMessage(client, id)
			return
		}
	}
}

func sendCloseMessage(client *WebSocketClient, id string) {
	msg := Message{Type: "close", ID: id}
	client.mutex.Lock()
	if client.conn != nil {
		client.conn.WriteJSON(msg)
	}
	client.mutex.Unlock()

	client.socksMutex.Lock()
	delete(client.socksConns, id)
	client.socksMutex.Unlock()

	atomic.AddInt32(&client.stats.activeConns, -1)
}
