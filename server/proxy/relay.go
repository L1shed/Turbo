package proxy

import (
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"server/data"
	"server/proxy/socks"
	"sync/atomic"
	"time"
)

var (
	nextID            int
	connectionTimeout = 5 * time.Second
)

type ClientStats struct {
	ConnectTime   time.Time
	ActiveConns   int32
	BytesSent     uint64
	BytesReceived uint64
	CryptoAddr    string
}

func HandleSocksConn(conn net.Conn) {
	defer conn.Close()

	host, port, _, err := socks.HandleSocksHandshake(conn)
	// TODO:    ^ params logic

	if err != nil {
		log.Println("SOCKS handshake failed:", err)
		return
	}

	var client *QuicClient
	success := false
	attempts := 0

	for !success && attempts < 3 {
		client = FindAvailableClient()
		if client == nil {
			log.Println("No active clients available")
			return
		}

		// Assign ID and set up connection
		client.mutex.Lock()
		id := fmt.Sprintf("%d", nextID)
		nextID++
		client.mutex.Unlock()

		dataChan := make(chan []byte, 100)
		sc := &socks.SocksConn{
			ID:       id,
			Conn:     conn,
			DataChan: dataChan,
			Metrics: socks.ConnectionMetrics{
				Timestamp: time.Now().Unix(),
				Protocol:  conn.RemoteAddr().Network(),
			},
		}

		client.socksMutex.Lock()
		client.socksConns[id] = sc
		client.socksMutex.Unlock()

		go client.HandleSocksConnection(sc)

		atomic.AddInt32(&client.Stats.ActiveConns, 1)

		// Send CONNECT request over QUIC
		msg := Message{Type: "connect", ID: id, Host: host, Port: port}
		err = client.SendMessage(msg)

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
			if respMsg.Status == "success" {
				success = true

				_, err = conn.Write([]byte{5, 0, 0, 1, 0, 0, 0, 0, 0, 0})
				if err != nil {
					log.Println(err)
					client.SendCloseMessage(sc.ID)
					continue
				}
				client.Metrics.Reliability *= 1.02
				client.UpdateScore()

				go relayFromSocksToQuic(client, sc, sc.ID)
				relayFromChanToSocks(client, sc, sc.ID)
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

func (c *QuicClient) HandleSocksConnection(sc *socks.SocksConn) {
	go func() {
		buffer := make([]byte, 32*1024)
		for {
			n, err := sc.Conn.Read(buffer)
			if err != nil {
				c.SendCloseMessage(sc.ID)
				return
			}

			if n > 0 {
				// Send data back to client
				encodedData := base64.StdEncoding.EncodeToString(buffer[:n])
				msg := Message{
					Type: "data",
					ID:   sc.ID,
					Data: encodedData,
				}

				if err := c.SendMessage(msg); err != nil {
					log.Printf("Failed to send data to client: %v", err)
					return
				}

				atomic.AddUint64(&c.Stats.BytesSent, uint64(n))
				atomic.AddUint64(&sc.Metrics.BytesSent, uint64(n))
			}
		}
	}()
}

func relayFromSocksToQuic(client *QuicClient, sc *socks.SocksConn, id string) {
	buf := make([]byte, 4096)
	for {
		n, err := sc.Conn.Read(buf)
		if err != nil {
			client.SendCloseMessage(id)
			return
		}

		dataSize := uint64(n)
		atomic.AddUint64(&client.Stats.BytesSent, dataSize)
		atomic.AddUint64(&sc.Metrics.BytesSent, dataSize)

		data := base64.StdEncoding.EncodeToString(buf[:n])
		msg := Message{Type: "data", ID: id, Data: data}
		if client.conn != nil {
			client.SendMessage(msg)
		}
	}
}

func relayFromChanToSocks(client *QuicClient, sc *socks.SocksConn, id string) {
	for data := range sc.DataChan {
		_, err := sc.Conn.Write(data)
		if err != nil {
			client.SendCloseMessage(id)
			return
		}
	}
}

func (c *QuicClient) SendCloseMessage(id string) {
	msg := Message{Type: "close", ID: id}
	if c.conn != nil {
		c.SendMessage(msg)
	}

	c.socksMutex.Lock()
	sc := c.socksConns[id]
	delete(c.socksConns, id)
	c.socksMutex.Unlock()

	data.LogConnection(sc)

	atomic.AddInt32(&c.Stats.ActiveConns, -1)
}
