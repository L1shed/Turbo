package socks

import (
	"net"
)

type SocksConn struct {
	ID       string
	Conn     net.Conn
	DataChan chan []byte
}
