package platform

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"
)

const serviceTemplate = `[Unit]
Description=Turbo
After=network.target

[Service]
ExecStart=/usr/local/bin/Turbo
Restart=always
User=%s
Environment=PATH=/usr/local/bin:/usr/bin
WorkingDirectory=%s

[Install]
WantedBy=multi-user.target
`

func EnableAutoStart() error {
	usr, err := user.Current()
	if err != nil {
		return err
	}

	executable, err := os.Executable()
	if err != nil {
		return err
	}

	os.Link(executable, "/usr/local/bin/Turbo")

	serviceContent := fmt.Sprintf(serviceTemplate, usr.Username, usr.HomeDir)

	err = os.WriteFile("/etc/systemd/system/turbo.service", []byte(serviceContent), 0644)

	err = exec.Command("systemctl daemon-reexec").Run()
	if err != nil {
		return err
	}
	err = exec.Command("systemctl daemon-reload").Run()
	if err != nil {
		return err
	}
	err = exec.Command("systemctl enable turbo.service").Run()
	if err != nil {
		return err
	}
	err = exec.Command("systemctl start turbo.service").Run()
	if err != nil {
		return err
	}

	return nil
}
