package data

import (
	"encoding/json"
	"os"
	"server/proxy/socks"
)

func LogConnection(sc *socks.SocksConn) {
	logFile, _ := os.OpenFile("logs/connections.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	data, _ := json.Marshal(sc.Metrics)

	logFile.Write(data)
}
