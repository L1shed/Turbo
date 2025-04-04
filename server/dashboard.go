package main

import (
	"fmt"
	"html/template"
	"net/http"
	"strings"
	"sync/atomic"
	"time"
)

var templates = template.Must(template.ParseFiles("templates/stats.html"))

type ClientStats struct {
	connectTime   time.Time
	activeConns   int32
	bytesSent     uint64
	bytesReceived uint64
	bitcoinAddr   string
}

type ClientData struct {
	ID              string
	BitcoinAddr     string
	ActiveTime      string
	ActiveConns     int32
	BytesIn         string
	BytesOut        string
	TotalBytes      string
	EstimatedReward string
}

type ViewData struct {
	Title    string
	Clients  []ClientData
	Address  string
	NotFound bool
}

func getClientData(id string, client *WebSocketClient) ClientData {
	bytesIn := atomic.LoadUint64(&client.stats.bytesReceived)
	bytesOut := atomic.LoadUint64(&client.stats.bytesSent)
	totalBytes := bytesIn + bytesOut
	activeTime := time.Since(client.stats.connectTime).Round(time.Second)
	activeConns := atomic.LoadInt32(&client.stats.activeConns)

	return ClientData{
		ID:              id,
		BitcoinAddr:     client.stats.bitcoinAddr,
		ActiveTime:      activeTime.String(),
		ActiveConns:     activeConns,
		BytesIn:         formatBytes(bytesIn),
		BytesOut:        formatBytes(bytesOut),
		TotalBytes:      formatBytes(totalBytes),
		EstimatedReward: fmt.Sprintf("$%.4f", float64(totalBytes)/1_000_000_000*0.01), // TODO: proper reward calculation
	}
}

func statsHandler(w http.ResponseWriter, r *http.Request) {
	if strings.HasPrefix(r.RemoteAddr, "[::1]:57750") {
		println(r.RemoteAddr)
		w.WriteHeader(http.StatusForbidden)
		return
	}

	address := r.URL.Query().Get("address")

	viewData := ViewData{
		Title:   "Client Statistics",
		Address: address,
		Clients: []ClientData{},
	}

	clientMutex.RLock()
	defer clientMutex.RUnlock()

	if address != "" {
		// Search for clients with specified Bitcoin address
		for id, client := range clients {
			if client.stats.bitcoinAddr == address {
				viewData.Clients = append(viewData.Clients, getClientData(id, client))
			}
		}
		viewData.NotFound = len(viewData.Clients) == 0
	} else {
		// Show all clients
		for id, client := range clients {
			viewData.Clients = append(viewData.Clients, getClientData(id, client))
		}
	}

	templates.ExecuteTemplate(w, "stats.html", viewData)
}

func formatBytes(bytes uint64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := uint64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.2f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}
