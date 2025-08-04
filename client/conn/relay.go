package conn

import "encoding/base64"

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
