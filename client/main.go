package main

import (
	"client/conn"
	"client/platform"
	"client/ui"
	_ "embed"
	"log"

	"github.com/getlantern/systray"
)

//go:embed assets/tray_icon.ico
var iconData []byte

const (
	VERSION = "0.1.0-experimental"
	WEBSITE = "https://turbo-node.vercel.app"
)

func main() {
	go conn.ConnectQuicServer()

	systray.Run(onReady, nil)
}

func onReady() {
	ui.SetupTray(WEBSITE, iconData)

	if err := platform.EnableAutoStart(); err != nil {
		log.Println(err)
	}

	if err := AutoUpdate(); err != nil {
		log.Println(err)
	}
}
