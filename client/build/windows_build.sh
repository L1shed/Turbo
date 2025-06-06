cd ..
GOOS=windows GOARCH=amd64 go build -ldflags="-H windowsgui" -o build/Turbo.exe

if "%1"=="--installer" (
    echo This would create a Windows installer with something like NSIS or InnoSetup
)
