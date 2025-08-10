package data

import (
	"encoding/json"
	"os"
	"server/database"
	"server/proxy/socks"
)

func LogSession(sc *socks.ProxyConn) {
	if sc == nil || sc.Metrics == nil {
		return
	}

	logFile, _ := os.OpenFile(".logs/connections.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)

	if logFile == nil {
		logFile, _ = os.Create(".logs/connections.log")
	}

	data, _ := json.Marshal(sc.Metrics)

	_, err := logFile.Write(data)
	if err != nil {
		return
	}

	database.PublishFeatures(data)
}
