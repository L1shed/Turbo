package main

import (
	"io"
	"log"
	"net/http"
)

const (
	listenAddr    = "127.0.0.1:5520"
	allowedOrigin = Website
)

// gets data from website through a local POST request
func listenWallet() {
	http.HandleFunc("/update-wallet", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)

		log.Println(r.Header.Get("Origin"))

		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
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
