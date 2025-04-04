package proxy

import (
	"encoding/binary"
	"errors"
	"io"
	"net"
)

const (
	SocksVersion = 5

	NoAuth = 0x00

	ConnectCommand = 0x01

	IPv4Address = 0x01
	FQDN        = 0x03
	IPv6Address = 0x04
)

// HandleSocksHandshake parses and initiates SOCKS5 handshake
func HandleSocksHandshake(conn net.Conn) (string, int, error) {
	// Read SOCKS version and number of auth methods
	header := make([]byte, 2)
	if _, err := io.ReadFull(conn, header); err != nil {
		return "", 0, err
	}

	if header[0] != SocksVersion {
		return "", 0, errors.New("unsupported SOCKS version")
	}

	authMethods := make([]byte, header[1])
	if _, err := io.ReadFull(conn, authMethods); err != nil {
		return "", 0, err
	}

	noAuthSupported := false
	for _, method := range authMethods {
		if method == NoAuth {
			noAuthSupported = true
			break
		}
	}

	if !noAuthSupported {
		return "", 0, errors.New("no supported auth methods")
	}

	response := []byte{SocksVersion, NoAuth}
	if _, err := conn.Write(response); err != nil {
		return "", 0, err
	}

	request := make([]byte, 4)
	if _, err := io.ReadFull(conn, request); err != nil {
		return "", 0, err
	}

	if request[0] != SocksVersion {
		return "", 0, errors.New("invalid SOCKS version in request")
	}

	if request[1] != ConnectCommand {
		return "", 0, errors.New("only CONNECT command is supported")
	}

	var targetAddr string
	var targetPort int

	switch request[3] {
	case IPv4Address:
		addr := make([]byte, 4)
		if _, err := io.ReadFull(conn, addr); err != nil {
			return "", 0, err
		}
		targetAddr = net.IPv4(addr[0], addr[1], addr[2], addr[3]).String()

	case FQDN:
		lenByte := make([]byte, 1)
		if _, err := io.ReadFull(conn, lenByte); err != nil {
			return "", 0, err
		}
		fqdnLen := int(lenByte[0])
		fqdn := make([]byte, fqdnLen)
		if _, err := io.ReadFull(conn, fqdn); err != nil {
			return "", 0, err
		}
		targetAddr = string(fqdn)

	case IPv6Address:
		addr := make([]byte, 16)
		if _, err := io.ReadFull(conn, addr); err != nil {
			return "", 0, err
		}
		targetAddr = net.IP(addr).String()

	default:
		return "", 0, errors.New("unsupported address type")
	}

	// Read port
	portBytes := make([]byte, 2)
	if _, err := io.ReadFull(conn, portBytes); err != nil {
		return "", 0, err
	}
	targetPort = int(binary.BigEndian.Uint16(portBytes))

	return targetAddr, targetPort, nil
}
