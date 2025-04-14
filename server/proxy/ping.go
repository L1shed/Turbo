package proxy

import (
	"log"
	"math"
	"time"
)

type Metrics struct {
	Latency        float64
	latencyReports float64
	Availability   float64
	Reliability    float64
	Score          float64
}

func reportPing() {
	ticker := time.NewTicker(time.Second * 60)
	defer ticker.Stop()

	for range ticker.C {
		ClientMutex.RLock()
		for _, client := range Clients {
			client.Ping()
		}
		ClientMutex.RUnlock()
	}
}

func (c *WebSocketClient) Ping() {
	c.mutex.Lock()
	c.conn.WriteJSON(&Message{
		Type: "ping",
		ID:   "",
	})
	c.mutex.Unlock()

	c.lastPing = time.Now()
}

func (c *WebSocketClient) Pong(latency int16) {
	log.Println("client", c.id, "ponged:", latency, "ms")
	mean := c.Metrics.Latency
	c.Metrics.latencyReports++
	reports := c.Metrics.latencyReports

	if reports < 5 {
		if reports == 1 {
			mean = float64(latency)
		}
		go c.Ping()
	}

	c.Metrics.Latency = (mean*reports - mean + float64(latency)) / reports

	c.UpdateScore()
}

func (c *WebSocketClient) UpdateScore() {
	latencyScore := math.Max(0, math.Min(1.0, 1.0-(c.Metrics.Latency-10)/500))
	reliabilityScore := c.Metrics.Reliability
	println("latency score:", latencyScore, "reliability:", reliabilityScore)

	// Calculate weighted score: 60% latency, 40% reliability
	score := 100 * ((0.6 * latencyScore) + (0.4 * reliabilityScore))

	if reliabilityScore > 1.2 {
		c.Metrics.Reliability = 1.2
	}

	c.Metrics.Score = score
}

func (c *WebSocketClient) RegisterFeedback() {
}
