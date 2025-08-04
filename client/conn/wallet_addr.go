package conn

import (
	"io"
	"log"
	"net/http"
)

const (
	listenAddr = "127.0.0.1:5520"
)

// Deprecated: ListenWallet gets data from website through a local POST request
func ListenWallet(allowedOrigin string) {
	http.HandleFunc("/update-wallet", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)

		origin := r.Header.Get("Origin")
		if origin != allowedOrigin {
			http.Error(w, "Forbidden", http.StatusForbidden)
			log.Printf("Request from %s is not allowed (origin: %s)", r.RemoteAddr, origin)
			return
		}

		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}
		defer r.Body.Close()

		wallet := string(bodyBytes)

		log.Printf("Received wallet: %+v\n", wallet)

		sendMessage(&Message{Type: "address", ID: wallet})

		w.WriteHeader(http.StatusOK)
	})
	log.Fatal(http.ListenAndServe(listenAddr, nil))
}
