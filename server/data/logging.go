package data

import (
	"encoding/csv"
	"encoding/json"
	"log"
	"os"
	"server/database"
	"strconv"
	"time"
)

type ConnectionMetrics struct {
	StartTime      time.Time     `json:"start_time"`
	BytesSent      uint64        `json:"bytes_sent"`
	BytesReceived  uint64        `json:"bytes_received"`
	ConnectionTime time.Duration `json:"connection_time"`
	Duration       float64       `json:"session_duration_ms"`
	RequestCount   int           `json:"request_count"`
	Protocol       string        `json:"protocol"` // "HTTP", "HTTPS", "TCP", etc.
	UserAgent      string        `json:"user_agent,omitempty"`
	ErrorCount     int           `json:"error_count"`
	ThroughputMbps float64       `json:"throughput_mbps"`
}

func LogConnection(metrics *ConnectionMetrics) {
	if metrics == nil {
		return
	}

	logFile, _ := os.OpenFile(".logs/connections.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	if logFile == nil {
		logFile, _ = os.Create(".logs/connections.log")
	}

	data, err := json.Marshal(metrics)
	if err != nil {
		log.Printf("Failed to log connection: %v", err)
	}
	data = append(data, '\n')

	_, err = logFile.Write(data)
	if err != nil {
		return
	}

	database.PublishFeatures(data)

	LogDataset(metrics)
}

func LogDataset(metrics *ConnectionMetrics) {
	f, err := os.OpenFile("dataset.csv", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()

	writer := csv.NewWriter(f)
	defer writer.Flush()

	row := []string{
		metrics.StartTime.Format(time.RFC3339Nano),
		strconv.FormatUint(metrics.BytesSent, 10),
		strconv.FormatUint(metrics.BytesReceived, 10),
		metrics.ConnectionTime.String(),
		strconv.FormatFloat(metrics.Duration, 'f', -1, 64),
		strconv.Itoa(metrics.RequestCount),
		metrics.Protocol,
		metrics.UserAgent,
		strconv.Itoa(metrics.ErrorCount),
		strconv.FormatFloat(metrics.ThroughputMbps, 'f', -1, 64),
	}

	writer.Write(row)
}
