package proxy

import (
	"math"
	"math/rand"
)

const ScoreWeight = 0.1

func FindAvailableClient() *QuicClient {
	QuicMutex.RLock()
	defer QuicMutex.RUnlock()

	totalWeight := 0.0
	for _, client := range QuicClients {
		totalWeight += math.Pow(client.Metrics.Score, ScoreWeight)
	}

	if totalWeight == 0 {
		return nil
	}

	randomPoint := rand.Float64() * totalWeight

	currentWeight := 0.0
	for _, client := range QuicClients {
		currentWeight += math.Pow(client.Metrics.Score, ScoreWeight)

		if currentWeight >= randomPoint {
			return client
		}
	}

	return nil
}
