package update

import (
	"fmt"
	"os"
	"path/filepath"
)

func replaceExecutable(newExecutable []byte) error {
	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("getting current executable path: %w", err)
	}
	exeName := filepath.Base(currentExe)

	dir := filepath.Dir(currentExe)
	newPath := filepath.Join(dir, exeName+"_"+VERSION+".new")
	backupPath := filepath.Join(dir, exeName+"_"+VERSION+".old")

	f, err := os.OpenFile(newPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return fmt.Errorf("creating new executable: %w", err)
	}

	if _, err = f.Write(newExecutable); err != nil {
		f.Close()
		return fmt.Errorf("writing new executable: %w", err)
	}

	if err = f.Sync(); err != nil {
		f.Close()
		return fmt.Errorf("sync new executable: %w", err)
	}
	f.Close()

	if err = os.Rename(currentExe, backupPath); err != nil {
		return fmt.Errorf("creating backup: %w", err)
	}

	if err = os.Rename(newPath, currentExe); err != nil {
		_ = os.Rename(backupPath, currentExe)
		return fmt.Errorf("replacing with new executable: %w", err)
	}

	os.Remove(backupPath) // TODO: delete on next startup
	return nil
}
