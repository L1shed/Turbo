package proxy

import (
	"encoding/base64"
	"fmt"
	"github.com/gorilla/websocket"
	"log"
	"net"
	"net/http"
	"server/proxy/socks"
	"sync"
	"sync/atomic"
	"time"
)

type Message struct {
	Type   string `json:"type"`
	ID     string `json:"id"`
	Host   string `json:"host,omitempty"`
	Port   int    `json:"port,omitempty"`
	Data   string `json:"data,omitempty"`
	Status string `json:"status,omitempty"`
	Error  string `json:"error,omitempty"`
}

var (
	Clients     = make(map[string]*WebSocketClient)
	ClientMutex sync.RWMutex
	nextID      int
	upgrader    = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	connectionTimeout = 5 * time.Second
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
	Metrics    *Metrics
	Stats      *ClientStats
}

type ClientStats struct {
	ConnectTime   time.Time
	ActiveConns   int32
	BytesSent     uint64
	BytesReceived uint64
	BitcoinAddr   string
}

// SocksConn holds the SOCKS5 connection and its data channel
type SocksConn struct {
	id       string
	conn     net.Conn
	dataChan chan []byte
}

func WSHandler(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}

	clientID := r.RemoteAddr
	log.Printf("New WebSocket client connected: %s", clientID)

	if Clients[clientID] != nil {
		http.Error(w, "A client with your IP address is already connected to the network", http.StatusConflict)
		return
	}

	client := &WebSocketClient{
		id:         clientID,
		conn:       c,
		socksConns: make(map[string]*SocksConn),
		respChans:  make(map[string]chan Message),
		Metrics: &Metrics{
			Reliability: 0.7,
		},
		Stats: &ClientStats{
			ConnectTime: time.Now(),
			BitcoinAddr: "not_set",
		},
	}

	ClientMutex.Lock()
	Clients[clientID] = client
	ClientMutex.Unlock()

	go wsReader(client)
}

func wsReader(client *WebSocketClient) {
	defer func() {
		ClientMutex.Lock()
		delete(Clients, client.id)
		ClientMutex.Unlock()

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
					atomic.AddUint64(&client.Stats.BytesReceived, dataSize)

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
			client.Stats.BitcoinAddr = msg.ID
			go client.Ping()
		case "pong":
			if time.Since(client.lastPing).Seconds() > 30 {
				client.conn.Close()
				// TODO: proper Timeout
				// TODO: proper close handling
			}
			client.Pong(int16(time.Since(client.lastPing).Milliseconds()))
		}
	}
}

func HandleSocksConn(conn net.Conn) {
	defer conn.Close()

	host, port, err := socks.HandleSocksHandshake(conn)

	if err != nil {
		log.Println("Failed parsing and handling initial SOCKS handshake:", err)
		return
	}

	var client *WebSocketClient
	success := false
	attempts := 0

	for !success && attempts < 3 {
		client = FindAvailableClient()
		if client == nil {
			log.Println("No active WebSocket Clients available")
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

		atomic.AddInt32(&client.Stats.ActiveConns, 1)

		// Send CONNECT request over WebSocket
		msg := Message{Type: "connect", ID: id, Host: host, Port: port}
		client.mutex.Lock()
		err = client.conn.WriteJSON(msg)
		client.mutex.Unlock()

		if err != nil {
			log.Println("WriteJSON error:", err)
			// Clean up and try another client
			client.socksMutex.Lock()
			delete(client.socksConns, id)
			client.socksMutex.Unlock()
			atomic.AddInt32(&client.Stats.ActiveConns, -1)
			continue
		}

		// Wait for connect response with timeout
		respChan := make(chan Message)
		client.respMutex.Lock()
		client.respChans[id] = respChan
		client.respMutex.Unlock()

		// Set up response timeout
		var respMsg Message
		select {
		case respMsg = <-respChan:
			// Response received within timeout
			if respMsg.Status == "success" {
				success = true

				_, err = conn.Write([]byte{5, 0, 0, 1, 0, 0, 0, 0, 0, 0})
				if err != nil {
					log.Println(err)
					sendCloseMessage(client, sc.id)
					continue
				}
				client.Metrics.Reliability *= 1.02
				client.UpdateScore()

				go relayFromSocksToWS(client, sc, sc.id)
				relayFromChanToSocks(client, sc, sc.id)
				return
			} else {
				log.Printf("Client %s failed to connect to %s:%d", client.id, host, port)
				client.socksMutex.Lock()
				delete(client.socksConns, id)
				client.socksMutex.Unlock()
				atomic.AddInt32(&client.Stats.ActiveConns, -1)
			}
		case <-time.After(connectionTimeout):
			log.Printf("Connection timeout for client %s to %s:%d", client.id, host, port)

			client.respMutex.Lock()
			delete(client.respChans, id)
			client.respMutex.Unlock()

			client.socksMutex.Lock()
			delete(client.socksConns, id)
			client.socksMutex.Unlock()

			client.Metrics.Reliability *= 0.8
			client.UpdateScore()

			atomic.AddInt32(&client.Stats.ActiveConns, -1)

		}
		attempts++
	}

	conn.Write([]byte{5, 1, 0, 1, 0, 0, 0, 0, 0, 0})
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
		atomic.AddUint64(&client.Stats.BytesSent, dataSize)

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

	atomic.AddInt32(&client.Stats.ActiveConns, -1)
}
