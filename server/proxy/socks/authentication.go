package socks

import (
	"context"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"io"
	"net"
	"server/database"
)

func Authenticate(conn net.Conn) (bool, string, error) {
	// Read auth version (must be 0x01)
	header := make([]byte, 1)
	if _, err := io.ReadFull(conn, header); err != nil {
		return false, "", err
	}

	if header[0] != 0x01 {
		return false, "", errors.New("unsupported auth version")
	}

	userLenBuf := make([]byte, 1)
	if _, err := io.ReadFull(conn, userLenBuf); err != nil {
		return false, "", err
	}
	userLen := userLenBuf[0]

	userBuf := make([]byte, userLen)
	if _, err := io.ReadFull(conn, userBuf); err != nil {
		return false, "", err
	}
	username := string(userBuf)

	passLenBuf := make([]byte, 1)
	if _, err := io.ReadFull(conn, passLenBuf); err != nil {
		return false, "", err
	}
	passLen := passLenBuf[0]

	passBuf := make([]byte, passLen)
	if _, err := io.ReadFull(conn, passBuf); err != nil {
		return false, "", err
	}
	//password := string(passBuf)

	storedHash, err := database.Rdb.HGet(context.Background(), "user:"+username, "password").Result()
	err2 := bcrypt.CompareHashAndPassword([]byte(storedHash), passBuf)

	// Authentication response: version 0x01 + status
	if err != nil || err2 != nil {
		conn.Write([]byte{0x01, GeneralFailure})
		return false, "", errors.New("authentication failed")
	}

	conn.Write([]byte{0x01, SuccessReply})
	return true, username, nil
}
