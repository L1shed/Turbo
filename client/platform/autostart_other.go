//go:build !windows

package platform

func EnableAutoStart() error {
	return nil
}
