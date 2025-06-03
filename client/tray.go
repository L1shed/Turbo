package main

import (
	_ "embed"
	"github.com/getlantern/systray"
	"log"
	"os/exec"
	"runtime"
)

//go:embed assets/icon.ico
var iconData []byte // Embed an icon file (Windows .ico)

func setupTray() {
	systray.SetTemplateIcon(iconData, iconData)
	systray.SetTooltip("Turbo running")

	dashboard := systray.AddMenuItem("Dashboard", "Open dashboard")
	quitItem := systray.AddMenuItem("Quit", "Quit the whole app")

	go func() {
		for {
			select {
			case <-dashboard.ClickedCh:
				err := open("http://localhost:8080")
				if err != nil {
					log.Println("Failed to open browser:", err)
				}
			case <-quitItem.ClickedCh:
				systray.Quit()
				return
			}
		}
	}()
}

func open(url string) error {
	var cmd string
	var args []string

	switch runtime.GOOS {
	case "windows":
		cmd = "cmd"
		args = []string{"/c", "start"}
	case "darwin":
		cmd = "open"
	default: // "linux", "freebsd", "openbsd", "netbsd"
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}
