package session

import (
	"net/http"
	"time"
)

func CheckCookie(w http.ResponseWriter, r *http.Request) *http.Cookie {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		newID := sm.NewState()
		http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/", Expires: time.Now().Add(time.Minute * 15)})
		id = &http.Cookie{Value: newID}
	}
	return id
}

func NewCookie(w http.ResponseWriter) *http.Cookie {
	newID := sm.NewState()
	http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/", Expires: time.Now().Add(time.Minute * 15)})
	return &http.Cookie{Value: newID}
}
