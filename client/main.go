package main

import (
	"client/platform"
	"github.com/getlantern/systray"
	"log"
	"net"
)

const Website = "http://localhost:3000"

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

func main() {
	systray.Run(onReady, nil)

	log.Error(platform.EnableAutoStart())
}

func onReady() {
	setupTray()

	go connectQuicServer()
}
