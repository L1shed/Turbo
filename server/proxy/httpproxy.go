package proxy

import (
	"encoding/base64"
	"fmt"
	"log"
	"net/http"
	"server/data"
	"strings"
	"sync/atomic"
	"time"
)

type HTTPProxy struct {
}

func (p *HTTPProxy) ServeHTTP(wr http.ResponseWriter, req *http.Request) {
	auth, _ := strings.CutPrefix(req.Header.Get("Proxy-Authorization"), "Basic")
	userPass, _ := base64.StdEncoding.DecodeString(auth)

	log.Println(req.RemoteAddr, " ", req.Method, " ", req.URL, "", string(userPass))
	for k, v := range req.Header {
		log.Println("Header: ", k, ":", v)
	}

	if req.Method != "CONNECT" {
		http.Error(wr, "Non-HTTPS websites are not supported yet", http.StatusBadRequest)
		return
	}

	wr.WriteHeader(http.StatusOK)
	hijacker, ok := wr.(http.Hijacker)
	if !ok {
		http.Error(wr, "Hijacking not supported", http.StatusInternalServerError)
		return
	}

	client := FindAvailableClient()
	if client == nil {
		log.Println("No active clients available")
		http.Error(wr, "No active clients available", http.StatusServiceUnavailable)
		return
	}

	conn, _, err := hijacker.Hijack()
	if err != nil {
		http.Error(wr, err.Error(), http.StatusServiceUnavailable)
		return
	}
	defer conn.Close()

	id := fmt.Sprintf("%d", nextID)
	nextID++
	dataChan := make(chan []byte, 100)
	sc := &Connection{
		ID:       id,
		Conn:     conn,
		DataChan: dataChan,
		Metrics: &data.ConnectionMetrics{
			StartTime: time.Now(),
			Protocol:  conn.RemoteAddr().Network(),
		},
	}

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

	client.userMutex.Lock()
	client.userConns[id] = sc
	client.userMutex.Unlock()
	atomic.AddInt32(&client.Stats.ActiveConns, 1)
	client.SendMessage(Message{
		Type: "connect",
		ID:   id,
		Addr: req.Host,
		Data: connData,
	})

	go relayFromSocksToQuic(client, sc, sc.ID)
	relayFromChanToSocks(client, sc, sc.ID)
}
