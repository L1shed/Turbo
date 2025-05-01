package main

import (
	"flag"
	"github.com/getlantern/systray"
	"net"
)

type Message struct {
	Type   string `json:"type"`
	ID     string `json:"id"`
	Host   string `json:"host,omitempty"`
	Port   int    `json:"port,omitempty"`
	Data   string `json:"data,omitempty"`
	Status string `json:"status,omitempty"`
	Error  string `json:"error,omitempty"`
}

type Connection struct {
	conn     net.Conn
	dataChan chan []byte
}

var (
	bitcoinAddr *string
)

func main() {
	bitcoinAddr = flag.String("address", "undefined", "Send automatic Bitcoin rewards")

	systray.Run(onReady, nil)
}

func onReady() {
	setupTray()

	go connectQuicServer()
}
