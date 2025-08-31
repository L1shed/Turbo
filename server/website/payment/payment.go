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
	if err != nil || id.Value == "" || GetState(id.Value) == nil {
		newID := NewState()
		http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/"})
		id = &http.Cookie{Value: newID}
	}

	state := GetState(id.Value)
	if state == nil {
		http.Error(w, "Invalid state", http.StatusBadRequest)
		return
	}

	ExecuteTemplate(w, "select", state)
}

func paymentHandler(w http.ResponseWriter, r *http.Request) {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		http.Redirect(w, r, "/payment/", http.StatusSeeOther)
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
		SetAddress(id.Value, address)

		UpdateState(id.Value, func(state *State) {
			state.Currency = currency
			state.GB = gb
			state.Address = address
			state.Status = "waiting"
		})
	}

	state := GetState(id.Value)

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

func paymentSubmit(w http.ResponseWriter, r *http.Request) {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		http.Redirect(w, r, "/payment/", http.StatusSeeOther)
		return
	}

	currency := r.FormValue("currency")
	gbStr := r.FormValue("gb")
	gb, err := strconv.ParseFloat(gbStr, 64)
	if err != nil || gb <= 0 {
		http.Error(w, "Invalid GB amount", http.StatusBadRequest)
		return
	}

	address := generateAddress(currency, id.Value)
	SetAddress(id.Value, address)

	UpdateState(id.Value, func(state *State) {
		state.Currency = currency
		state.GB = gb
		state.Address = address
		state.Status = "waiting"
	})
}

func credentialsHandler(w http.ResponseWriter, r *http.Request) {
	id, err := r.Cookie("transaction_id")
	if err != nil || id.Value == "" {
		selectHandler(w, r)
		return
	}

	state := GetState(id.Value)

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

	id := GetIDByAddress(payload.Address)
	if id == "" {
		http.Error(w, "Unknown address", http.StatusBadRequest)
		return
	}

	Pay(id, payload.Amount)
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

	state := GetState(id)
	if state == nil {
		http.Error(w, "Invalid ID", http.StatusBadRequest)
		return
	}

	Pay(id, amount)
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Payment simulated"))
}

func getCookieState(w http.ResponseWriter, r *http.Request) *State {
	id, err := r.Cookie("transaction_id")
	var state *State
	if err != nil || id.Value == "" || GetState(id.Value) == nil {
		newID := NewState()
		http.SetCookie(w, &http.Cookie{Name: "transaction_id", Value: newID, Path: "/", Expires: time.Now().Add(time.Minute * 15)})
		id = &http.Cookie{Value: newID}
		state = GetState(newID)
	}
	state = GetState(id.Value)
	return state
}

// Deprecated: removal
func Init() {
	http.HandleFunc("/payment/", func(w http.ResponseWriter, r *http.Request) {
		state := getCookieState(w, r)

		if r.Method == "POST" {
			paymentHandler(w, r)
			return
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
	http.HandleFunc("/payment", paymentHandler)
	http.HandleFunc("/webhook", webhookHandler)
	http.HandleFunc("/debug_pay", debugPayHandler)

	initTemplates("select", "payment", "credentials")
}
