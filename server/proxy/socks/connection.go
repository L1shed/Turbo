package socks

import (
	"net"
	"time"
)

type ConnectionMetrics struct {
	Timestamp int64  `json:"timestamp"`
	ClientIP  string `json:"client_ip"`
	//DestinationHost string  `json:"destination_host"` not useful
	//DestinationPort int     `json:"destination_port"`
	BytesSent      uint64        `json:"bytes_sent"`
	BytesReceived  uint64        `json:"bytes_received"`
	ConnectionTime time.Duration `json:"connection_time"`
	Duration       float64       `json:"session_duration_ms"`
	RequestCount   int           `json:"request_count"`
	Protocol       string        `json:"protocol"` // "HTTP", "HTTPS", "TCP", etc.
	UserAgent      string        `json:"user_agent,omitempty"`
	HTTPMethod     string        `json:"http_method,omitempty"`
	//StatusCode      int     `json:"status_code,omitempty"`
	ErrorCount     int     `json:"error_count"`
	ThroughputMbps float64 `json:"throughput_mbps"`
}

type SocksConn struct {
	ID       string
	Conn     net.Conn
	DataChan chan []byte
	Metrics  *ConnectionMetrics
}
