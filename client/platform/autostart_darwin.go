package platform

import (
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"strings"
)

const plistName = "me.lished.turbo.plist"

func EnableAutoStart() error {
	usr, err := user.Current()
	if err != nil {
		return err
	}

	executable, err := os.Executable()
	if err != nil {
		return err
	}

	launchAgentsDir := filepath.Join(usr.HomeDir, "Library", "LaunchAgents")
	os.MkdirAll(launchAgentsDir, 0755)

	currentPlistPath := filepath.Join("./assets", plistName)

	plistPath := filepath.Join(launchAgentsDir, plistName)

	if data, err := os.ReadFile(currentPlistPath); err != nil {
		return err
	} else if err := os.WriteFile(plistPath, []byte(strings.Replace(string(data), "{executable_path}", executable, 1)), 0644); err != nil {
		return err
	}

	return exec.Command("launchctl", "load", plistPath).Start()
}
