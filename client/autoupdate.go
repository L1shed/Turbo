package main

import (
	"encoding/json"
	"fmt"
	"golang.org/x/mod/semver"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

type GitHubRelease struct {
	TagName string `json:"tag_name"`
	Assets  []struct {
		Name               string `json:"name"`
		BrowserDownloadURL string `json:"browser_download_url"`
	} `json:"assets"`
}

const url = "https://api.github.com/repos/L1shed/Turbo/releases/latest"

func AutoUpdate() error {
	client := http.Client{
		Timeout: 10 * time.Second,
	}

	release, hasUpdate, err := checkForUpdate(client)
	if err != nil {
		if strings.Contains(err.Error(), "404") {
			return nil // No release yet
		}
		return fmt.Errorf("checking for updates: %w", err)
	}
	if !hasUpdate {
		return nil
	}

	assetURL, err := findAssetForPlatform(release)
	if err != nil {
		return fmt.Errorf("finding asset url: %w", err)
	}

	assetData, err := downloadUpdate(client, assetURL)
	if err != nil {
		return fmt.Errorf("downloading update: %w", err)
	}

	if err := replaceExecutable(assetData); err != nil {
		return fmt.Errorf("replacing executable: %w", err)
	}

	return nil
}

func checkForUpdate(client http.Client) (*GitHubRelease, bool, error) {
	req, err := http.NewRequest("GET", url, nil)

	if err != nil {
		return nil, false, fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("User-Agent", "Turbo-updater/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, false, fmt.Errorf("fetching release info: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, false, fmt.Errorf("GitHub API returned status %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, false, fmt.Errorf("decoding release info: %w", err)
	}
	hasUpdate := semver.Compare(release.TagName, VERSION) == +1

	return &release, hasUpdate, nil
}

func findAssetForPlatform(release *GitHubRelease) (string, error) {
	var assetURL string
	for _, asset := range release.Assets {
		assetName := strings.ToLower(asset.Name)

		if strings.Contains(assetName, runtime.GOOS+"-"+runtime.GOARCH) {
			assetURL = asset.BrowserDownloadURL
			break
		}
	}

	if assetURL == "" {
		return "", fmt.Errorf("no suitable asset found for %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	return assetURL, nil
}

func downloadUpdate(client http.Client, url string) ([]byte, error) {
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating download request: %w", err)
	}

	req.Header.Set("User-Agent", "Turbo-updater/1.0")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("downloading asset: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("download failed with status %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func replaceExecutable(newExecutable []byte) error {
	currentExe, err := os.Executable()
	if err != nil {
		return fmt.Errorf("getting current executable path: %w", err)
	}

	cacheDir, err := os.UserCacheDir()
	if err != nil {
		return fmt.Errorf("getting user cache directory: %w", err)
	}

	backupPath := filepath.Join(cacheDir, filepath.Base(currentExe)+"_"+VERSION+".backup")
	if err := os.Rename(currentExe, backupPath); err != nil {
		return fmt.Errorf("creating backup: %w", err)
	}

	if err := os.WriteFile(currentExe, newExecutable, 0755); err != nil {
		os.Rename(backupPath, currentExe)
		return fmt.Errorf("writing new executable: %w", err)
	}

	os.Remove(backupPath)
	return nil
}
