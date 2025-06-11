package payment

import (
	"fmt"
	"sync"
)

// State represents the transaction state for a user session.
type State struct {
	ID             string // Unique transaction ID
	Currency       string // Selected cryptocurrency (BTC or ETH)
	Address        string // Generated cryptocurrency address
	Status         string
	GB             float64 // Final GB amount confirmed
	Amount         float64 // Amount to send
	AmountReceived float64 // Amount received from payment
	Username       string
	Password       string
}

// StateManager manages transaction states across requests.
type StateManager struct {
	mu          sync.Mutex
	states      map[string]*State // Map of transaction ID to state
	addressToID map[string]string // Map of address to transaction ID
	nextID      int
}

// Global state manager instance.
var sm = &StateManager{
	states:      make(map[string]*State),
	addressToID: make(map[string]string),
	nextID:      1,
}

func NewState() string {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	id := fmt.Sprintf("%06d", sm.nextID) // TODO: more complex IDs
	sm.nextID++
	sm.states[id] = &State{ID: id, Status: "selecting"}
	return id
}

func GetState(id string) *State {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	// if state contains id
	return sm.states[id]
}

func UpdateState(id string, updateFunc func(*State)) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	if state, ok := sm.states[id]; ok {
		updateFunc(state)
	}
}

func SetAddress(id, address string) {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	sm.addressToID[address] = id
}

func GetIDByAddress(address string) string {
	sm.mu.Lock()
	defer sm.mu.Unlock()
	return sm.addressToID[address]
}
