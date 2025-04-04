package main

// findAvailableClient finds a connected WebSocket client with load balancing
/*func findAvailableClient() *WebSocketClient {
	clientMutex.RLock()
	defer clientMutex.RUnlock()

	var selectedClient *WebSocketClient
	var minConnections int32 = -1
	var minLatency time.Duration = -1 // Initialize with a negative value

	for _, client := range clients {
		if !client.isConnected {
			continue
		}

		activeConns := atomic.LoadInt32(&client.activeConns)
		client.mutex.Lock()
		latency := client.latency
		client.mutex.Unlock()

		if selectedClient == nil ||
			activeConns < minConnections ||
			(activeConns == minConnections && latency < minLatency) { // prioritize lower latency if connection count is the same
			selectedClient = client
			minConnections = activeConns
			minLatency = latency
		}
	}

	if selectedClient != nil {
		selectedClient.mutex.Lock()
		log.Printf("Selected client %s, Connections: %d, Latency: %v", selectedClient.conn.RemoteAddr(), atomic.LoadInt32(&selectedClient.activeConns), selectedClient.latency)
		selectedClient.mutex.Unlock()
	}

	return selectedClient
}*/

type Metrics struct {
	LatencyReport []int16
	LatencyMean   float64
	Availability  float64
	Reliability   float64
	Score         float64
}

func findAvailableClient() *WebSocketClient {
	clientMutex.RLock()
	defer clientMutex.RUnlock()

	var bestClient *WebSocketClient

	for _, client := range clients {
		latency := client.metrics.LatencyMean

		if latency == 0 {
			go client.ping()
			continue
		}

		if bestClient == nil || latency < bestClient.metrics.LatencyMean {
			bestClient = client
		}
	}
	return bestClient
}
