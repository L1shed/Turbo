package proxy

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"server/proxy/socks"
	"sync"
	"sync/atomic"
	"time"

	"github.com/quic-go/quic-go"
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
	QuicClients  = make(map[string]*QuicClient)
	QuicMutex    sync.RWMutex
	quicListener *quic.Listener
)

// QuicClient represents a connected QUIC client
type QuicClient struct {
	id         string
	conn       quic.Connection
	stream     quic.Stream
	mutex      sync.Mutex
	socksConns map[string]*socks.SocksConn
	socksMutex sync.Mutex
	respChans  map[string]chan Message
	respMutex  sync.Mutex
	lastPing   time.Time
	Metrics    *Metrics
	Stats      *ClientStats
}

// StartQuicServer initializes the QUIC server
func StartQuicServer(addr string, tlsConfig *tls.Config) error {
	listener, err := quic.ListenAddr(addr, tlsConfig, nil)
	if err != nil {
		return fmt.Errorf("failed to start QUIC server: %w", err)
	}

	quicListener = listener
	log.Printf("QUIC server listening on %s", addr)

	go acceptQuicConnections(quicListener)

	go ReportPing()

	return nil
}

func acceptQuicConnections(listener *quic.Listener) {
	for {
		conn, err := listener.Accept(context.Background())
		if err != nil {
			log.Printf("QUIC accept error: %v", err)
			continue
		}

		go handleQuicConnection(conn)
	}
}

func handleQuicConnection(conn quic.Connection) {
	clientID := conn.RemoteAddr().String()
	log.Printf("New QUIC client connected: %s", clientID)

	// Accept a bidirectional stream
	stream, err := conn.AcceptStream(context.Background())
	if err != nil {
		log.Printf("Failed to accept QUIC stream: %v", err)
		conn.CloseWithError(1, "stream accept failed")
		return
	}

	client := &QuicClient{
		id:         clientID,
		conn:       conn,
		stream:     stream,
		socksConns: make(map[string]*socks.SocksConn),
		respChans:  make(map[string]chan Message),
		Metrics: &Metrics{
			Reliability: 0.7,
			Score:       50,
		},
		Stats: &ClientStats{
			ConnectTime: time.Now(),
			BitcoinAddr: "",
		},
	}

	QuicMutex.Lock()
	QuicClients[clientID] = client
	QuicMutex.Unlock()

	go quicReader(client)
}

func quicReader(client *QuicClient) {
	defer func() {
		QuicMutex.Lock()
		delete(QuicClients, client.id)
		QuicMutex.Unlock()

		client.stream.Close()
		client.conn.CloseWithError(0, "client disconnected")
		log.Printf("Closed QUIC client: %s", client.id)
	}()

	decoder := json.NewDecoder(client.stream)
	for {
		var msg Message
		if err := decoder.Decode(&msg); err != nil {
			log.Printf("QUIC read error: %v", err)
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
					atomic.AddUint64(&sc.Metrics.BytesReceived, dataSize)
					sc.DataChan <- data
				}
			}
			client.socksMutex.Unlock()
		case "close":
			client.socksMutex.Lock()
			if sc, ok := client.socksConns[msg.ID]; ok {
				sc.Conn.Close()
				delete(client.socksConns, msg.ID)
			}
			client.socksMutex.Unlock()
		case "address":
			client.Stats.BitcoinAddr = msg.ID
		case "pong":
			client.Pong()
		}
	}
}

func (c *QuicClient) SendMessage(msg Message) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	data, err := json.Marshal(msg)
	if err != nil {
		return err
	}
	data = append(data, '\n') // Add newline for JSON decoder

	_, err = c.stream.Write(data)
	return err
}
