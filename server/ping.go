package main

import (
	"log"
	"time"
)

func reportPing() {
	ticker := time.NewTicker(time.Second * 60)
	defer ticker.Stop()

	for range ticker.C {
		clientMutex.RLock()
		for _, client := range clients {
			client.ping()
		}
		clientMutex.RUnlock()
	}
}

func (c *WebSocketClient) ping() {
	c.mutex.Lock()
	c.conn.WriteJSON(&Message{
		Type: "ping",
		ID:   "",
	})
	c.mutex.Unlock()

	c.lastPing = time.Now()
}

func (c *WebSocketClient) pong(latency int16) {
	log.Println("client", c.id, " ping: ", latency)
	list := c.metrics.LatencyReport
	mean := c.metrics.LatencyMean

	sliceLen := float64(len(list))

	if sliceLen < 10 {
		list = append(list, latency)
		sum := 0.0
		for _, val := range list {
			sum += float64(val)
		}
		c.metrics.LatencyMean = sum / float64(len(list))
		c.metrics.LatencyReport = list

		go c.ping()
	} else {
		removed := float64(list[0])
		list = list[1:]
		list = append(list, latency)

		c.metrics.LatencyMean = (mean*sliceLen - removed + float64(latency)) / sliceLen
		c.metrics.LatencyReport = list
	}
}
