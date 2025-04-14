package proxy

import (
	"fmt"
	"log"
	"net"
	"server/proxy/socks"
	"sync"
	"sync/atomic"
	"time"
)

func CHandleSocksConn(conn net.Conn) {
	defer conn.Close()

	host, port, err := socks.HandleSocksHandshake(conn)

	if err != nil {
		log.Println("Failed parsing and handling initial SOCKS handshake", err)
		return
	}

	// Find two clients for the competition
	clients := FindTopTwoClients()
	if len(clients) < 1 {
		log.Println("No active WebSocket Clients available")
		return
	}

	// Create competition for this connection
	competition := &CompetingConnection{
		clients:    clients,
		ids:        make([]string, len(clients)),
		sockConn:   conn,
		host:       host,
		port:       port,
		resultChan: make(chan *ConnectionResult, len(clients)),
	}

	// Launch connection attempts in parallel
	for i, client := range competition.clients {
		// Assign unique ID for this client's connection attempt
		client.mutex.Lock()
		id := fmt.Sprintf("%d", nextID)
		nextID++
		client.mutex.Unlock()

		competition.ids[i] = id

		// Create data channel for this connection
		dataChan := make(chan []byte, 100)
		sc := &SocksConn{
			id:       id,
			conn:     conn,
			dataChan: dataChan,
		}

		client.socksMutex.Lock()
		client.socksConns[id] = sc
		client.socksMutex.Unlock()

		atomic.AddInt32(&client.Stats.ActiveConns, 1)

		// Launch connection attempt for this client
		go initiateClientConnection(client, id, host, port, competition)
	}

	// Wait for first successful connection or all failures
	success := handleCompetitionResults(competition)

	if !success {
		conn.Write([]byte{5, 1, 0, 1, 0, 0, 0, 0, 0, 0}) // Send connection failure
		return
	}
}

type CompetingConnection struct {
	clients       []*WebSocketClient
	ids           []string
	competitionMu sync.Mutex
	winnerChosen  bool
	sockConn      net.Conn
	host          string
	port          int
	resultChan    chan *ConnectionResult
}

type ConnectionResult struct {
	client *WebSocketClient
	id     string
	status string
	msg    Message
}

func initiateClientConnection(client *WebSocketClient, id string, host string, port int, competition *CompetingConnection) {
	// Send CONNECT request over WebSocket
	msg := Message{Type: "connect", ID: id, Host: host, Port: port}
	client.mutex.Lock()
	err := client.conn.WriteJSON(msg)
	client.mutex.Unlock()

	if err != nil {
		log.Println("WriteJSON error:", err)
		// Clean up and report failure
		client.socksMutex.Lock()
		delete(client.socksConns, id)
		client.socksMutex.Unlock()
		atomic.AddInt32(&client.Stats.ActiveConns, -1)
		competition.resultChan <- &ConnectionResult{client: client, id: id, status: "error"}
		return
	}

	// Wait for connect response
	respChan := make(chan Message)
	client.respMutex.Lock()
	client.respChans[id] = respChan
	client.respMutex.Unlock()

	// Set up response timeout
	select {
	case respMsg := <-respChan:
		competition.resultChan <- &ConnectionResult{client: client, id: id, status: respMsg.Status, msg: respMsg}
	case <-time.After(connectionTimeout):
		log.Printf("Connection timeout for client %s to %s:%d", client.id, host, port)

		client.respMutex.Lock()
		delete(client.respChans, id)
		client.respMutex.Unlock()

		client.socksMutex.Lock()
		delete(client.socksConns, id)
		client.socksMutex.Unlock()

		client.Metrics.Reliability *= 0.8
		client.UpdateScore()

		atomic.AddInt32(&client.Stats.ActiveConns, -1)

		competition.resultChan <- &ConnectionResult{client: client, id: id, status: "timeout"}
	}
}

func handleCompetitionResults(competition *CompetingConnection) bool {
	var winnerClient *WebSocketClient
	var winnerID string
	resultsReceived := 0
	clientCount := len(competition.clients)

	// Wait for all results or until we have a winner
	for resultsReceived < clientCount {
		result := <-competition.resultChan
		resultsReceived++

		// Check if this is a successful connection and we haven't chosen a winner yet
		competition.competitionMu.Lock()
		if result.status == "success" && !competition.winnerChosen {
			competition.winnerChosen = true
			winnerClient = result.client
			winnerID = result.id

			// Reward the winner
			winnerClient.Metrics.Reliability *= 1.02
			winnerClient.UpdateScore()

			// Notify success to the SOCKS client
			_, err := competition.sockConn.Write([]byte{5, 0, 0, 1, 0, 0, 0, 0, 0, 0})
			if err != nil {
				log.Println("Error writing to SOCKS client:", err)
				competition.competitionMu.Unlock()
				return false
			}
			competition.competitionMu.Unlock()

			// Clean up losing connections before proceeding
			cleanupLosingConnections(competition, winnerClient, winnerID)

			// Set up relay for the winning connection
			sc := winnerClient.socksConns[winnerID]
			go relayFromSocksToWS(winnerClient, sc, winnerID)
			relayFromChanToSocks(winnerClient, sc, winnerID)
			return true
		}
		competition.competitionMu.Unlock()

		// If all results are in and no success, return failure
		if resultsReceived == clientCount {
			cleanupAllConnections(competition)
			return false
		}
	}

	return false
}

func cleanupLosingConnections(competition *CompetingConnection, winnerClient *WebSocketClient, winnerID string) {
	// Cancel all other connection attempts
	for i, client := range competition.clients {
		id := competition.ids[i]

		// Skip the winning connection
		if client == winnerClient && id == winnerID {
			continue
		}

		// Cancel and clean up this connection
		sendCloseMessage(client, id)
	}
}

func cleanupAllConnections(competition *CompetingConnection) {
	// Clean up all connections when there's no winner
	for i, client := range competition.clients {
		sendCloseMessage(client, competition.ids[i])
	}
}

func FindTopTwoClients() []*WebSocketClient {
	ClientMutex.RLock()
	defer ClientMutex.RUnlock()

	// Find the top two clients by reliability score
	var clients []*WebSocketClient

	// Copy all clients to a slice
	for _, client := range Clients {
		clients = append(clients, client)
	}

	// Sort by reliability score (simple bubble sort for small number of clients)
	for i := 0; i < len(clients)-1; i++ {
		for j := 0; j < len(clients)-i-1; j++ {
			if clients[j].Metrics.Reliability < clients[j+1].Metrics.Reliability {
				clients[j], clients[j+1] = clients[j+1], clients[j]
			}
		}
	}

	// Return top two clients, or fewer if not enough clients are available
	if len(clients) >= 2 {
		return clients[:2]
	}
	return clients
}
