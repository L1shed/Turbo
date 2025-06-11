package main

import (
	"client/conn"
	"client/platform"
	"github.com/getlantern/systray"
	"log"
)

const (
	VERSION = "experimental"
	WEBSITE = "http://localhost:3000"
)

func main() {
	go conn.ListenWallet(WEBSITE)

	log.Println(platform.EnableAutoStart())
	systray.Run(onReady, nil)

}

func onReady() {
	setupTray()

	go conn.ConnectQuicServer()
}
