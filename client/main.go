package main

import (
	"client/platform/autostart"
	"client/platform/update"
	"client/quic"
	"client/ui"
	_ "embed"
	"log"

	"github.com/getlantern/systray"
)

//go:embed assets/tray_icon.ico
var iconData []byte

const (
	WEBSITE = "https://turbo-node.vercel.app"
)

func main() {
	go quic.ConnectQuicServer()

	systray.Run(onReady, nil)
}

func onReady() {
	ui.SetupTray(WEBSITE, iconData)

	if err := autostart.EnableAutoStart(); err != nil {
		log.Println(err)
	}

	if err := update.AutoUpdate(); err != nil {
		log.Println(err)
		quic.SendMessage(&quic.Message{
			Type: "stacktrace",
			Data: "Auto-update failed: " + err.Error(),
		})
	}
}
