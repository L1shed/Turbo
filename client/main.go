package main

import (
	"client/conn"
	"client/platform"
	"github.com/getlantern/systray"
	"log"
)

const (
	VERSION = "0.1.0-experimental"
	WEBSITE = "http://localhost:3000"
)

func main() {
	go conn.ListenWallet(WEBSITE)
	go conn.ConnectQuicServer()

	systray.Run(onReady, nil)
	select {}
}

func onReady() {
	setupTray()

	if err := platform.EnableAutoStart(); err != nil {
		log.Println(err)
	}

	if err := AutoUpdate(); err != nil {
		log.Println(err)
	}
}
