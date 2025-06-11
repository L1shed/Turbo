package website

import (
	"fmt"
	"html/template"
	"net/http"
	"server/proxy"
	"strconv"
	"sync/atomic"
	"time"
)

var templates, _ = template.ParseFiles("./templates/stats.html")

type ClientData struct {
	ID              string
	BitcoinAddr     string
	ActiveTime      string
	ActiveConns     int32
	BytesIn         string
	BytesOut        string
	TotalBytes      string
	Ping            string
	Score           string
	EstimatedReward string
}

type ViewData struct {
	Title    string
	Clients  []ClientData
	Address  string
	NotFound bool
}

func getClientData(id string, client *proxy.QuicClient) ClientData {
	bytesIn := atomic.LoadUint64(&client.Stats.BytesReceived)
	bytesOut := atomic.LoadUint64(&client.Stats.BytesSent)
	totalBytes := bytesIn + bytesOut
	activeTime := time.Since(client.Stats.ConnectTime).Round(time.Second)
	activeConns := atomic.LoadInt32(&client.Stats.ActiveConns)

	return ClientData{
		ID:              id,
		BitcoinAddr:     client.Stats.BitcoinAddr,
		ActiveTime:      activeTime.String(),
		ActiveConns:     activeConns,
		BytesIn:         formatBytes(bytesIn),
		BytesOut:        formatBytes(bytesOut),
		TotalBytes:      formatBytes(totalBytes),
		Ping:            fmt.Sprintf("%.1f ms", client.Metrics.Latency),
		Score:           fmt.Sprintf("%.0f/100", client.Metrics.Score),
		EstimatedReward: fmt.Sprintf("$%.4f", float64(totalBytes)/(1024*1024*1024)/0.01), //0. TODO: proper reward calculation
	}
}

func StatsHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: isolate from online connections

	address := r.URL.Query().Get("address")

	viewData := ViewData{
		Title:   "Client Statistics",
		Address: address,
		Clients: []ClientData{},
	}

	proxy.QuicMutex.RLock()
	defer proxy.QuicMutex.RUnlock()

	if address != "" {
		// Search for clients with specified Bitcoin address
		for id, client := range proxy.QuicClients {
			if client.Stats.BitcoinAddr == address {
				viewData.Clients = append(viewData.Clients, getClientData(id, client))
			}
		}
		viewData.NotFound = len(viewData.Clients) == 0
	} else {
		i := 1
		// Show all clients
		for _, client := range proxy.QuicClients {
			viewData.Clients = append(viewData.Clients, getClientData("anon"+strconv.Itoa(i), client))
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
