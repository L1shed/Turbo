package main

import (
	"context"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"sync"
	"time"

	"github.com/quic-go/quic-go"
)

var (
	quicConn    quic.Connection
	quicStream  quic.Stream
	quicMutex   sync.Mutex
	clientConns = make(map[string]*Connection)
	clientMutex sync.Mutex
)

func connectQuicServer() {
	connectionAttempts := 0
	retryDelay := time.Second * 4

	tlsConf := &tls.Config{
		InsecureSkipVerify: true,                    // Note: In production, use proper certificate validation
		NextProtos:         []string{"turbo-proxy"}, // Custom protocol name
	}

	for {
		ctx := context.Background()
		conn, err := quic.DialAddr(ctx, "localhost:8443", tlsConf, nil)
		if err != nil {
			if connectionAttempts == 2 {
				retryDelay = time.Minute * 5
			}

			log.Println("Failed to connect to QUIC server. Retrying...")
			time.Sleep(retryDelay)
			connectionAttempts++
			continue
		}
		log.Println("Connected to QUIC server")

		// Open a new bidirectional stream
		stream, err := conn.OpenStreamSync(ctx)
		if err != nil {
			log.Println("Failed to open QUIC stream:", err)
			conn.CloseWithError(1, "failed to open stream")
			time.Sleep(retryDelay)
			connectionAttempts++
			continue
		}

		quicMutex.Lock()
		quicConn = conn
		quicStream = stream
		quicMutex.Unlock()
		connectionAttempts = 0

		sendMessage(&Message{Type: "address", ID: *bitcoinAddr})

		quicReader(stream)

		log.Println("QUIC connection closed, reconnecting...")

		time.Sleep(time.Second * 2)
	}
}

func quicReader(stream quic.Stream) {
	decoder := json.NewDecoder(stream)

	for {
		var msg Message
		err := decoder.Decode(&msg)
		if err != nil {
			log.Println("QUIC read error:", err)

			clientMutex.Lock()
			for id, cc := range clientConns {
				cc.conn.Close()
				close(cc.dataChan)
				delete(clientConns, id)
			}
			clientMutex.Unlock()

			return
		}

		switch msg.Type {
		case "connect":
			go handleConnect(msg)
		case "data":
			clientMutex.Lock()
			if cc, ok := clientConns[msg.ID]; ok {
				if data, err := base64.StdEncoding.DecodeString(msg.Data); err == nil {
					cc.dataChan <- data
				}
			}
			clientMutex.Unlock()
		case "close":
			clientMutex.Lock()
			if cc, ok := clientConns[msg.ID]; ok {
				cc.conn.Close()
				delete(clientConns, msg.ID)
			}
			clientMutex.Unlock()
		case "ping":
			err := sendMessage(&Message{
				Type: "pong",
				ID:   msg.ID,
			})
			if err != nil {
				log.Fatal("error sending pong:", err)
			}
		}
	}
}

func sendMessage(msg *Message) error {
	quicMutex.Lock()
	defer quicMutex.Unlock()

	if quicStream == nil {
		log.Println("Cannot send message: no active QUIC stream")
		return fmt.Errorf("no active QUIC stream")
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message of type %s: %v", msg.Type, err)
		return err
	}
	data = append(data, '\n') // Add newline for JSON decoder

	_, err = quicStream.Write(data)
	if err != nil {
		log.Printf("Error writing to QUIC stream: %v", err)
		return err
	}

	return nil
}

func handleConnect(msg Message) {
	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", msg.Host, msg.Port))
	respMsg := Message{Type: "connect_response", ID: msg.ID}
	if err != nil {
		respMsg.Status = "failure"
		respMsg.Error = err.Error()
		sendMessage(&respMsg)
		return
	}
	respMsg.Status = "success"
	sendMessage(&respMsg)

	dataChan := make(chan []byte, 100)
	cc := &Connection{conn: conn, dataChan: dataChan}

	clientMutex.Lock()
	clientConns[msg.ID] = cc
	clientMutex.Unlock()

	go relayFromConnToQuic(cc, msg.ID)
	go relayFromChanToConn(cc, msg.ID) // go or not go?
}

func relayFromConnToQuic(cc *Connection, id string) {
	buf := make([]byte, 4096)
	for {
		n, err := cc.conn.Read(buf)
		if err != nil {
			sendCloseMessage(id)
			return
		}
		data := base64.StdEncoding.EncodeToString(buf[:n])
		msg := Message{Type: "data", ID: id, Data: data}
		sendMessage(&msg)
	}
}

func relayFromChanToConn(cc *Connection, id string) {
	for data := range cc.dataChan {
		if _, err := cc.conn.Write(data); err != nil {
			sendCloseMessage(id)
			return
		}
	}
}

func sendCloseMessage(id string) {
	msg := Message{Type: "close", ID: id}
	sendMessage(&msg)
	clientMutex.Lock()
	delete(clientConns, id)
	clientMutex.Unlock()
}
