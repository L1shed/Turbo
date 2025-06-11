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

func ReportPing() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		for _, client := range QuicClients {
			client.lastPing = time.Now()
			err := client.SendMessage(Message{
				Type: "ping",
			})
			if err != nil {
				log.Printf("Failed to send ping: %v", err)
				return
			}
		}
	}
}

func (c *QuicClient) Pong() {
	c.Metrics.Latency = float64(int16(time.Since(c.lastPing).Milliseconds()))
	c.UpdateScore()
}

func (c *QuicClient) UpdateScore() {
	latencyScore := math.Max(0, math.Min(1.0, 1.0-(c.Metrics.Latency-10)/500))
	reliabilityScore := c.Metrics.Reliability

	// weighted score: 60% latency, 40% reliability
	score := 100 * ((0.6 * latencyScore) + (0.4 * reliabilityScore))

	if reliabilityScore > 1.2 {
		c.Metrics.Reliability = 1.2
	}

	c.Metrics.Score = score
}
