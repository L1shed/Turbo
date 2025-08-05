package conn

import (
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"strings"
)

func handleConnect(msg Message) {
	var destHost string
	if len(strings.Split(msg.Host, ":")) <= 2 {
		destHost = msg.Host
	} else {
		destHost = fmt.Sprintf("%s:%d", msg.Host, msg.Port)
	}

	conn, err := net.Dial("tcp", destHost)
	if err != nil || conn == nil {
		log.Printf("Failed to connect to %s:%d: %v", msg.Host, msg.Port, err)
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
