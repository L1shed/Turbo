import { useState, useCallback } from 'react';
import { WebSocketMessage } from '../types';

export interface WebSocketHookReturn {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  lastMessage: WebSocketMessage | null;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: WebSocketMessage) => void;
}

export const useWebSocket = (url: string): WebSocketHookReturn => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const connect = useCallback(() => {
    console.log('Simulating WebSocket connection to:', url);
    setConnectionStatus('connecting');
    
    setTimeout(() => {
      // Simulate a failed connection for now, as per original logic
      setConnectionStatus('disconnected'); 
      console.log('WebSocket connection failed (simulated)');
      
      setLastMessage({
        type: 'connection',
        data: { isConnected: false }
      });
    }, 2000);
  }, [url]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
    setConnectionStatus('disconnected');
  }, [socket]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    // This is a mock send, actual implementation would use socket.send
    console.log('Would send WebSocket message:', message);
  }, []);

  return {
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  };
};
