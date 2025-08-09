package conn

import (
	"io"
	"log"
	"net"
	"net/http"
	"strconv"
)

func UIDCollector() string {
	listener, _ := net.Listen("tcp", "127.0.0.1:")
	mux := http.NewServeMux()

	mux.HandleFunc("/auth-result", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*.vercel.app")

		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		uid := string(bodyBytes)

		log.Printf("Received UID: %+v\n", uid)
		sendMessage(&Message{Type: "uid-register", ID: uid})

		w.WriteHeader(http.StatusOK)

		go func() {
			listener.Close()
		}()
	})
	net.Listen("tcp", "127.0.0.1:")

	server := &http.Server{Handler: mux}
	go func() {
		server.Serve(listener)
	}()

	return strconv.Itoa(listener.Addr().(*net.TCPAddr).Port)
}
