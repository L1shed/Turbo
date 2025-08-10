package socks

import (
	"errors"
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
	// username is actually the type of proxy , e.g. residential

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

	credits, err := database.GetCredits(username, actualPassword)
	_ = credits
	// TODO: create local user struct to consume credits

	// Authentication response: version 0x01 + status
	if err != nil {
		conn.Write([]byte{0x01, GeneralFailure})
		return false, nil, err
	}

	conn.Write([]byte{0x01, SuccessReply})

	return true, params, nil
}
