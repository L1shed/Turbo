package main

import (
	"fmt"
	"github.com/getlantern/systray"
	"log"
	"os"
	"os/exec"
	"runtime"
)

func setupTray() {
	icon := getIcon("assets/icon.ico")
	systray.SetTemplateIcon(icon, icon)
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

func getIcon(s string) []byte {
	b, err := os.ReadFile(s)
	if err != nil {
		fmt.Print(err)
	}
	return b
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
