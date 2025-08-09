package ui

import (
	"client/conn"
	_ "embed"
	"github.com/getlantern/systray"
	"log"
	"os/exec"
	"runtime"
)

func SetupTray(websiteUrl string, icon []byte) {
	systray.SetTemplateIcon(icon, icon)
	systray.SetTooltip("Turbo running")

	connect := systray.AddMenuItem("Connect", "Connect with your account")
	dashboard := systray.AddMenuItem("Dashboard", "Open dashboard")
	quitItem := systray.AddMenuItem("Quit", "Quit the whole app")

	dashboard.Hide()

	go func() {
		for {
			select {
			case <-connect.ClickedCh:
				port := conn.UIDCollector()
				err := open("http://localhost:3000" + "/api/desktop-auth?port=" + port)
				if err != nil {
					log.Println("Failed to open browser:", err)
				}

				connect.Hide()
				dashboard.Show()
			case <-dashboard.ClickedCh:
				err := open(websiteUrl)
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
		cmd = "rundll32"
		args = []string{"url.dll,FileProtocolHandler"}
	case "darwin":
		cmd = "open"
	default:
		cmd = "xdg-open"
	}
	args = append(args, url)
	return exec.Command(cmd, args...).Start()
}
