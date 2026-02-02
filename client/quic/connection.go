package quic

import (
	"encoding/base64"
	"log"
	"net"
)

func handleConnect(msg Message) {
	conn, err := net.Dial("tcp", msg.Addr)
	if err != nil || conn == nil {
		log.Printf("Failed to connect to %s : %v", msg.Addr, err)
		sendCloseMessage(msg.ID)
		return
	}

	data, _ := base64.StdEncoding.DecodeString(msg.Data)
	_, err = conn.Write(data)
	if err != nil {
		return
	}

	dataChan := make(chan []byte, 100)
	cc := &Connection{conn: conn, dataChan: dataChan}

	clientMutex.Lock()
	clientConns[msg.ID] = cc
	clientMutex.Unlock()

	go relayFromConnToQuic(cc, msg.ID)
	go relayFromChanToConn(cc, msg.ID)
}
