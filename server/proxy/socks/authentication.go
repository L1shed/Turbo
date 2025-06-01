package socks

import (
	"context"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"io"
	"net"
	"server/database"
	"strings"
)

func Authenticate(conn net.Conn) (bool, map[string]string, error) {
	params := make(map[string]string)

	// Read auth version (must be 0x01)
	header := make([]byte, 1)
	if _, err := io.ReadFull(conn, header); err != nil {
		return false, nil, err
	}

	if header[0] != 0x01 {
		return false, nil, errors.New("unsupported auth version")
	}

	userLenBuf := make([]byte, 1)
	if _, err := io.ReadFull(conn, userLenBuf); err != nil {
		return false, nil, err
	}
	userLen := userLenBuf[0]

	userBuf := make([]byte, userLen)
	if _, err := io.ReadFull(conn, userBuf); err != nil {
		return false, nil, err
	}
	username := string(userBuf)

	passLenBuf := make([]byte, 1)
	if _, err := io.ReadFull(conn, passLenBuf); err != nil {
		return false, nil, err
	}
	passLen := passLenBuf[0]

	passBuf := make([]byte, passLen)
	if _, err := io.ReadFull(conn, passBuf); err != nil {
		return false, nil, err
	}
	passwordWithParams := string(passBuf)

	actualPassword := passwordWithParams
	if idx := strings.Index(passwordWithParams, "_"); idx != -1 {
		actualPassword = passwordWithParams[:idx]
		paramString := passwordWithParams[idx+1:]
		pairs := strings.Split(paramString, "_")
		for _, pair := range pairs {
			if kv := strings.SplitN(pair, "-", 2); len(kv) == 2 {
				params[kv[0]] = kv[1]
			}
		}
	}

	storedHash, err := database.Rdb.HGet(context.Background(), "user:"+username, "password").Result()
	err2 := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(actualPassword))

	// Authentication response: version 0x01 + status
	if err != nil || err2 != nil {
		//conn.Write([]byte{0x01, GeneralFailure})
		//return false, nil, errors.New("authentication failed")
	}

	conn.Write([]byte{0x01, SuccessReply})

	return true, params, nil
}
