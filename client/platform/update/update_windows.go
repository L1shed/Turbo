package update

import "fmt"

func replaceExecutable(newBinary []byte, expectedSHA256 string) error {
	if runtime.GOOS != "windows" {
		return errors.New("windows updater called on non-windows system")
	}

	exePath, err := os.Executable()
	if err != nil {
		return fmt.Errorf("executable path: %w", err)
	}

	dir := filepath.Dir(exePath)
	exeName := filepath.Base(exePath)

	// Verify integrity FIRST
	//if err := verifySHA256(newBinary, expectedSHA256); err != nil {
	//	return err
	//}

	// Write new binary
	if err = writeNewExecutable(dir, exeName, newBinary); err != nil {
		return fmt.Errorf("writing new executable: %w", err)
	}

	// Write updater
	if err = writeUpdateBat(dir, exeName); err != nil {
		return fmt.Errorf("writing updater script: %w", err)
	}

	// Run updater
	if err = runUpdater(dir); err != nil {
		return fmt.Errorf("running updater script: %w", err)
	}

	// Exit to release file lock
	os.Exit(0)
	return nil
}

func writeNewExecutable(dir, exeName string, data []byte) error {
	newPath := filepath.Join(dir, exeName+NewSuffix)

	f, err := os.OpenFile(newPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	defer f.Close()

	if _, err := f.Write(data); err != nil {
		return err
	}

	return f.Sync()
}

func writeUpdateBat(dir, exeName string) error {
	bat := fmt.Sprintf(`@echo off
set EXE=%s
set NEW=%s.new
set OLD=%s.old

:wait
tasklist | find /i "%%EXE%%" >nul
if not errorlevel 1 (
    timeout /t 1 /nobreak >nul
    goto wait
)

if exist "%%OLD%%" del "%%OLD%%"
rename "%%EXE%%" "%%OLD%%"
rename "%%NEW%%" "%%EXE%%"

start "" "%%EXE%%"
del "%%OLD%%"
del "%%~f0"
`, exeName, exeName, exeName)

	path := filepath.Join(dir, "update.bat")
	return os.WriteFile(path, []byte(bat), 0644)
}

func runUpdater(dir string) error {
	cmd := exec.Command("cmd", "/C", "update.bat")
	cmd.Dir = dir
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow: true,
	}
	return cmd.Start()
}
