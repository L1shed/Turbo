package proxy

import (
	"math/rand"
	"sort"
	"sync"
)

var (
	// Lock-free reads with sync.Map
	countryClients sync.Map // 2-digit country code -> *CountryPool
	globalClients  sync.Map // "global" -> *CountryPool

	updateMutex sync.RWMutex
)

type CountryPool struct {
	clients           []*QuicClient
	cumulativeWeights []float64 // Pre-computed for O(log n) selection
	totalWeight       float64
	lastUpdated       int64
}

func FindClientByCountry(countryCode string) *QuicClient {
	// Lock-free read
	if pool, ok := countryClients.Load(countryCode); ok {
		countryPool := pool.(*CountryPool)
		if client := selectFromPool(countryPool); client != nil {
			return client
		}
	}

	return nil
}

func selectFromPool(pool *CountryPool) *QuicClient {
	if pool.totalWeight == 0 || len(pool.clients) == 0 {
		return nil
	}

	// Try up to 3 times to find a healthy client
	for attempts := 0; attempts < 3; attempts++ {
		randomPoint := rand.Float64() * pool.totalWeight
		idx := sort.SearchFloat64s(pool.cumulativeWeights, randomPoint)
		if idx >= len(pool.clients) {
			idx = len(pool.clients) - 1
		}

		client := pool.clients[idx]

		if client.isHealthy() {
			return client
		}
	}

	return nil // All attempts failed
}

func (c *QuicClient) isHealthy() bool {
	return c != nil && c.conn != nil
}

func updatePools() {
	updateMutex.Lock()
	defer updateMutex.Unlock()

	var globalPool CountryPool
	for _, client := range QuicClients {
		if client.isHealthy() {
			weight := client.Metrics.Score
			if weight < 1 {
				weight = 1
			}
			globalPool.clients = append(globalPool.clients, client)
			if len(globalPool.cumulativeWeights) == 0 {
				globalPool.cumulativeWeights = append(globalPool.cumulativeWeights, weight)
			} else {
				cumWeight := globalPool.cumulativeWeights[len(globalPool.cumulativeWeights)-1]
				globalPool.cumulativeWeights = append(globalPool.cumulativeWeights, cumWeight+weight)
			}
			globalPool.totalWeight += weight
		}
	}
	globalClients.Store("global", &globalPool)

	countryMap := make(map[string]*CountryPool)
	for _, client := range QuicClients {
		if client.isHealthy() {
			country := client.Stats.CountryCode
			if country == "global" {
				continue
			}

			if _, exists := countryMap[country]; !exists {
				countryMap[country] = &CountryPool{}
			}
			pool := countryMap[country]
			weight := client.Metrics.Score
			if weight < 1 {
				weight = 1
			}
			pool.clients = append(pool.clients, client)
			if len(pool.cumulativeWeights) == 0 {
				pool.cumulativeWeights = append(pool.cumulativeWeights, weight)
			} else {
				cumWeight := pool.cumulativeWeights[len(pool.cumulativeWeights)-1]
				pool.cumulativeWeights = append(pool.cumulativeWeights, cumWeight+weight)
			}
			pool.totalWeight += weight
		}
	}
	for country, pool := range countryMap {
		countryClients.Store(country, pool)
	}
}
