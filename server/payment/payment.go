package payment

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"
)

func selectHandler(w http.ResponseWriter, r *http.Request) {
	// Get or set transaction ID via cookie
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" || sm.GetState(id.Value) == nil {
		newID := sm.NewState()
		http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/"})
		id = &http.Cookie{Value: newID}
	}

	state := sm.GetState(id.Value)
	if state == nil {
		http.Error(w, "Invalid state", http.StatusBadRequest)
		return
	}

	ExecuteTemplate(w, "select", state)
}

func paymentHandler(w http.ResponseWriter, r *http.Request) {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		http.Redirect(w, r, "/payment", http.StatusSeeOther)
		return
	}

	if r.Method == "POST" {
		currency := r.FormValue("currency")
		gbStr := r.FormValue("gb")
		gb, err := strconv.ParseFloat(gbStr, 64)
		if err != nil || gb <= 0 {
			http.Error(w, "Invalid GB amount", http.StatusBadRequest)
			return
		}

		address := generateAddress(currency, id.Value)
		sm.SetAddress(id.Value, address)

		sm.UpdateState(id.Value, func(state *State) {
			state.Currency = currency
			state.GB = gb
			state.Address = address
			state.Status = "waiting"
		})
	}

	state := sm.GetState(id.Value)

	if state == nil {
		selectHandler(w, r)
		return
	}

	if state.Status != "waiting" {
		if state.Status == "paid" {
			credentialsHandler(w, r)
		} else {
			selectHandler(w, r)
		}
		return
	}
	ExecuteTemplate(w, "payment", state)
}

func credentialsHandler(w http.ResponseWriter, r *http.Request) {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		selectHandler(w, r)
		return
	}

	state := sm.GetState(id.Value)

	if state == nil {
		selectHandler(w, r)
		return
	}

	if state.Status != "paid" {
		paymentHandler(w, r)
		return
	}

	// TODO: generate credentials

	ExecuteTemplate(w, "credentials", state)
}

// webhookHandler processes payment confirmation from a blockchain API.
func webhookHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Address  string  `json:"address"`
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	err := json.NewDecoder(r.Body).Decode(&payload)
	if err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	id := sm.GetIDByAddress(payload.Address)
	if id == "" {
		http.Error(w, "Unknown address", http.StatusBadRequest)
		return
	}

	sm.UpdateState(id, func(state *State) {
		state.AmountReceived = payload.Amount
		state.Status = "paid"
	})
	w.WriteHeader(http.StatusOK)
}

// debugPayHandler simulates a payment for debugging purposes.
func debugPayHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	amountStr := r.URL.Query().Get("amount")
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil || amount <= 0 {
		http.Error(w, "Invalid amount", http.StatusBadRequest)
		return
	}

	state := sm.GetState(id)
	if state == nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	sm.UpdateState(id, func(state *State) {
		state.AmountReceived = amount
		state.Status = "paid"
	})
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Payment simulated"))
}

func checkCookie(w http.ResponseWriter, r *http.Request) *http.Cookie {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		newID := sm.NewState()
		http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/", Expires: time.Now().Add(time.Minute * 15)})
		id = &http.Cookie{Value: newID}
	}
	return id
}

func Main() {
	http.HandleFunc("/select", selectHandler)
	http.HandleFunc("/payment/", func(w http.ResponseWriter, r *http.Request) {
		id := checkCookie(w, r)

		state := sm.GetState(id.Value)

		if sm.GetState(id.Value) == nil {
			newID := sm.NewState()
			http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/", Expires: time.Now().Add(time.Minute * 15)})
			id = &http.Cookie{Value: newID}
		}

		switch state.Status {
		case "selecting":
			selectHandler(w, r)
		case "waiting":
			paymentHandler(w, r)
		case "paid":
			credentialsHandler(w, r)
		default:
			selectHandler(w, r)
		}

		if strings.HasSuffix(r.URL.Path, "/select") {
			selectHandler(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/proceed") {
			paymentHandler(w, r)
		} else if strings.HasSuffix(r.URL.Path, "/credentials") {
			credentialsHandler(w, r)
		}
	})
	//http.HandleFunc("/payment", paymentHandler)
	http.HandleFunc("/credentials", credentialsHandler)
	http.HandleFunc("/webhook", webhookHandler)
	http.HandleFunc("/debug_pay", debugPayHandler)

	initTemplates("select", "payment", "credentials")
}
