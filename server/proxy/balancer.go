package proxy

import "math/rand"

func FindAvailableClient() *WebSocketClient {
	ClientMutex.RLock()
	defer ClientMutex.RUnlock()

	totalWeight := 0.0
	for _, client := range Clients {
		totalWeight += client.Metrics.Score * 2
	}

	if totalWeight == 0 {
		return nil
	}

	randomPoint := rand.Float64() * totalWeight

	currentWeight := 0.0
	for _, client := range Clients {
		currentWeight += client.Metrics.Score * 2

		if currentWeight >= randomPoint {
			return client
		}
	}

	return nil
}
