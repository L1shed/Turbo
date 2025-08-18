package proxy

import (
	"encoding/base64"
	"fmt"
	"log"
	"net"
	data2 "server/data"
	"server/proxy/socks"
	"sync/atomic"
	"time"
)

var (
	nextID         int
	connectTimeout = 5 * time.Second
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
		log.Printf("SOCKS handshake failed for %s, %v", conn.RemoteAddr(), err)
		return
	}

	var client *QuicClient

	id := fmt.Sprintf("%d", nextID)
	nextID++
	dataChan := make(chan []byte, 100)
	sc := &Connection{
		ID:       id,
		Conn:     conn,
		DataChan: dataChan,
		Metrics: &data2.ConnectionMetrics{
			StartTime: time.Now(),
			Protocol:  conn.RemoteAddr().Network(),
		},
	}

	_, err = conn.Write([]byte{5, 0, 0, 1, 0, 0, 0, 0, 0, 0}) // success
	if err != nil {
		log.Printf("Failed to send SOCKS success response to %s: %v", conn.RemoteAddr(), err)
		return
	}

	// Premake connect message
	buffer := make([]byte, 32*1024)
	var connData string
	n, err := sc.Conn.Read(buffer)
	if err != nil {
		return
	}
	if n > 0 {
		connData = base64.StdEncoding.EncodeToString(buffer[:n])
		atomic.AddUint64(&sc.Metrics.BytesSent, uint64(n))
	}
	msg := Message{Type: "connect", ID: id, Addr: fmt.Sprintf("%s:%d", host, port), Data: connData}

	success := false
	attempts := 0

	for !success && attempts < 3 {
		attempts++
		client = FindAvailableClient()
		if client == nil {
			log.Println("No active clients available")
			return
		}

		client.userMutex.Lock()
		client.userConns[id] = sc
		client.userMutex.Unlock()
		atomic.AddInt32(&client.Stats.ActiveConns, 1)

		err = client.SendMessage(msg)
		if err != nil {
			log.Println("WriteJSON error:", err)
			client.userMutex.Lock()
			delete(client.userConns, id)
			client.userMutex.Unlock()
			atomic.AddInt32(&client.Stats.ActiveConns, -1)
			continue
		}

		select {
		case <-sc.DataChan:
			success = true
		case <-time.After(connectTimeout):
			log.Printf("Connection timeout for client %s, retrying with another client", client.id)
			client.userMutex.Lock()
			delete(client.userConns, id)
			client.userMutex.Unlock()
			atomic.AddInt32(&client.Stats.ActiveConns, -1)
			continue
		}

		if success {
			atomic.AddUint64(&client.Stats.BytesSent, uint64(n))
			go relayFromSocksToQuic(client, sc, sc.ID)
			relayFromChanToSocks(client, sc, sc.ID)
			return
		}
	}

	conn.Write([]byte{5, 1, 0, 1, 0, 0, 0, 0, 0, 0})
}

func relayFromSocksToQuic(client *QuicClient, sc *Connection, id string) {
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

func relayFromChanToSocks(client *QuicClient, sc *Connection, id string) {
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

	c.userMutex.Lock()
	sc := c.userConns[id]
	delete(c.userConns, id)
	c.userMutex.Unlock()

	if sc != nil {
		data2.LogConnection(sc.Metrics)
		atomic.AddInt32(&c.Stats.ActiveConns, -1)
		sc.Conn.Close()
	} else {
		println("é- double closing")
	}

}
