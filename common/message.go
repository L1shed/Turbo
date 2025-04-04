package common

type Message struct {
	Type   string `json:"type"`
	ID     string `json:"id"`
	Host   string `json:"host,omitempty"`
	Port   int    `json:"port,omitempty"`
	Data   string `json:"data,omitempty"`
	Status string `json:"status,omitempty"`
	Error  string `json:"error,omitempty"`
}
