package proxy

import (
	"net"
	"server/data"
)

type Connection struct {
	ID       string
	Conn     net.Conn
	DataChan chan []byte
	Metrics  *data.ConnectionMetrics
}
