package main

import (
	"client/conn"
	"client/platform"
	"github.com/getlantern/systray"
	"log"
)

const (
	//VERSION = "0.1-experimental"
	VERSION = ""
	WEBSITE = "http://localhost:3000"
)

func main() {
	go conn.ListenWallet(WEBSITE)
	go conn.ConnectQuicServer()

	systray.Run(onReady, nil)
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
