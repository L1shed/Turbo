package main

import (
	"flag"
	"github.com/getlantern/systray"
	"github.com/gorilla/websocket"
	"net"
	"sync"
)

// TODO: UI
//  - info "payout every day at 00:00"
//  - real-time earning (bitcoin) data

type Message struct {
	Type   string `json:"type"`
	ID     string `json:"id"`
	Host   string `json:"host,omitempty"`
	Port   int    `json:"port,omitempty"`
	Data   string `json:"data,omitempty"`
	Status string `json:"status,omitempty"`
	Error  string `json:"error,omitempty"`
}

type Connection struct {
	conn     net.Conn
	dataChan chan []byte
}

var (
	wsConn  *websocket.Conn
	wsMutex sync.Mutex
	//clientConns = make(map[string]*Connection)
	//clientMutex sync.Mutex
	bitcoinAddr *string
)

func main() {
	bitcoinAddr = flag.String("address", "undefined", "Send automatic Bitcoin rewards")

	systray.Run(onReady, nil)
}

func onReady() {
	setupTray()

	/*connectionAttempts := 0
	println(os.Getpid())
	retryDelay := time.Second * (4 + time.Duration(os.Getpid()/1000))
	for {
		c, _, err := websocket.DefaultDialer.Dial("ws://192.168.1.144:8080/ws", nil)
		if err != nil {
			if connectionAttempts == 2 {
				retryDelay = time.Minute * 3
			}

			log.Println("Failed to connect to WebSocket server. Retrying...")
			time.Sleep(retryDelay)
			connectionAttempts++
			continue
		}
		log.Println("Connected to WebSocket server")
		wsConn = c
		connectionAttempts = 0

		wsConn.WriteJSON(&Message{Type: "address", ID: *bitcoinAddr})

		wsReader()
	}*/

	go connectQuicServer()
}

/*func onExit() {
	// Cleanup code here
	if wsConn != nil {
		wsConn.Close()
	}
	clientMutex.Lock()
	for _, cc := range clientConns {
		cc.conn.Close()
	}
	clientMutex.Unlock()
}*/

/*func wsReader() {
	for {
		var msg Message
		err := wsConn.ReadJSON(&msg)
		if err != nil {
			log.Println("ReadJSON error:", err)
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
			wsMutex.Lock()
			wsConn.WriteJSON(&Message{
				Type: "pong",
				ID:   msg.ID,
			})
			wsMutex.Unlock()
		}
	}
}

func handleConnect(msg Message) {
	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", msg.Host, msg.Port))
	respMsg := Message{Type: "connect_response", ID: msg.ID}
	if err != nil {
		respMsg.Status = "failure"
		respMsg.Error = err.Error()
		wsMutex.Lock()
		wsConn.WriteJSON(respMsg)
		wsMutex.Unlock()
		return
	}
	respMsg.Status = "success"
	wsMutex.Lock()
	wsConn.WriteJSON(respMsg)
	wsMutex.Unlock()

	dataChan := make(chan []byte, 100)
	cc := &Connection{conn: conn, dataChan: dataChan}
	clientMutex.Lock()
	clientConns[msg.ID] = cc
	clientMutex.Unlock()

	go relayFromConnToWS(cc, msg.ID)
	relayFromChanToConn(cc, msg.ID)
}

func relayFromConnToWS(cc *Connection, id string) {
	buf := make([]byte, 4096)
	for {
		n, err := cc.conn.Read(buf)
		if err != nil {
			sendCloseMessage(id)
			return
		}
		data := base64.StdEncoding.EncodeToString(buf[:n])
		msg := Message{Type: "data", ID: id, Data: data}
		wsMutex.Lock()
		wsConn.WriteJSON(msg)
		wsMutex.Unlock()
	}
}

func sendCloseMessage(id string) {
	msg := Message{Type: "close", ID: id}
	wsMutex.Lock()
	if wsConn != nil {
		wsConn.WriteJSON(msg)
	}
	wsMutex.Unlock()
	clientMutex.Lock()
	delete(clientConns, id)
	clientMutex.Unlock()
}*/
