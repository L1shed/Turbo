interface Message {
  type: string;
  id: string;
  host?: string;
  port?: number;
  data?: string;
  status?: string;
  error?: string;
}

// State management
let wsConnection: WebSocket | null = null;
let isConnected = false;
let bitcoinAddress = '';
let activeConnections = 0;
let reconnectTimer: number | null = null;

// Initialize when extension loads
chrome.runtime.onInstalled.addListener(async () => {
  const { bitcoinAddress: savedAddress = '' } = await chrome.storage.local.get('bitcoinAddress');
  bitcoinAddress = savedAddress;
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'getStatus':
      sendResponse({ 
        connected: isConnected,
        activeConnections: activeConnections
      });
      break;
      
    case 'updateAddress':
      bitcoinAddress = message.address;
      if (isConnected && wsConnection) {
        wsConnection.send(JSON.stringify({
          type: 'address',
          id: bitcoinAddress
        }));
      }
      sendResponse({ success: true });
      break;
      
    case 'toggleConnection':
      if (isConnected) {
        disconnectFromServer();
      } else {
        connectToServer();
      }
      sendResponse({ 
        connected: isConnected,
        activeConnections: activeConnections
      });
      break;
  }
  return true; // Keep the message channel open for async responses
});

// Connect to websocket server
function connectToServer() {
  if (wsConnection) {
    return; // Already connected or connecting
  }
  
  try {
    wsConnection = new WebSocket('ws://localhost:8080/ws');
    
    wsConnection.onopen = () => {
      console.log('Connected to server');
      isConnected = true;
      
      // Send bitcoin address if available
      if (bitcoinAddress) {
        wsConnection?.send(JSON.stringify({
          type: 'address',
          id: bitcoinAddress
        }));
      }
      
      // Clear any reconnect timer
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      
      // Notify popup about connection status
      updatePopupStatus();
    };
    
    wsConnection.onmessage = (event) => {
      handleWebSocketMessage(event.data);
    };
    
    wsConnection.onclose = () => {
      handleDisconnect();
    };
    
    wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
      handleDisconnect();
    };
  } catch (error) {
    console.error('Failed to connect:', error);
    handleDisconnect();
  }
}

// Handle disconnection and reconnect logic
function handleDisconnect() {
  isConnected = false;
  wsConnection = null;
  activeConnections = 0;
  updatePopupStatus();
  
  // Schedule reconnect attempt
  if (!reconnectTimer) {
    reconnectTimer = setTimeout(connectToServer, 5000);
  }
}

// Manually disconnect from server
function disconnectFromServer() {
  if (wsConnection) {
    wsConnection.close();
  }
  handleDisconnect();
  
  // Cancel reconnect attempt if scheduled
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// Update popup with current status
function updatePopupStatus() {
  chrome.runtime.sendMessage({
    type: 'statusUpdate',
    connected: isConnected,
    activeConnections: activeConnections
  });
}

// Handle incoming websocket messages
function handleWebSocketMessage(messageData: string) {
  try {
    const message = JSON.parse(messageData) as Message;
    
    switch (message.type) {
      case 'connect':
        handleConnect(message);
        break;
        
      case 'data':
        forwardData(message);
        break;
        
      case 'close':
        handleClose(message);
        break;
    }
  } catch (error) {
    console.error('Error processing websocket message:', error);
  }
}

// Handle connect request
function handleConnect(message: Message) {
  if (!message.host || !message.port) {
    sendConnectResponse(message.id, 'failure', 'Missing host or port');
    return;
  }
  
  // In this version, we'll simply acknowledge the connect request
  // since we can't directly open TCP connections from the extension
  console.log(`Connection request to ${message.host}:${message.port} with ID: ${message.id}`);
  
  // Send success response
  sendConnectResponse(message.id, 'success');
  activeConnections++;
  updatePopupStatus();
}

// Forward data message (simplified in this version)
function forwardData(message: Message) {
  if (message.id && message.data) {
    console.log(`Received data for connection ${message.id}`);
    // In the real implementation, we would forward this data to the TCP connection
    // Here we just acknowledge receipt
  }
}

// Handle close message
function handleClose(message: Message) {
  if (message.id) {
    console.log(`Connection closed: ${message.id}`);
    activeConnections = Math.max(0, activeConnections - 1);
    updatePopupStatus();
  }
}

// Send connect response to server
function sendConnectResponse(id: string, status: string, error?: string) {
  if (!wsConnection || !isConnected) return;
  
  const response: Message = {
    type: 'connect_response',
    id: id,
    status: status
  };
  
  if (error) {
    response.error = error;
  }
  
  wsConnection.send(JSON.stringify(response));
}

// Initial connection attempt if address is available
if (bitcoinAddress) {
  connectToServer();
}