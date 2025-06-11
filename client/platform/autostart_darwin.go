package platform

import (
	"log"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
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

	log.Println(executable)

	launchAgentsDir := filepath.Join(usr.HomeDir, "Library", "LaunchAgents")
	os.MkdirAll(launchAgentsDir, 0755)

	currentPlistPath := filepath.Join("./assets", plistName)
	//currentPlistPath := filepath.Join(executable, "../Ressources", "me.lished.turbo.plist")

	plistPath := filepath.Join(launchAgentsDir, plistName)

	if data, err := os.ReadFile(currentPlistPath); err != nil {
		return err
	} else if err := os.WriteFile(plistPath, data, 0644); err != nil {
		return err
	}

	return exec.Command("launchctl", "load", plistPath).Start()
}
