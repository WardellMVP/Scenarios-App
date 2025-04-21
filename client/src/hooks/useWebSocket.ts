import { useState, useEffect, useCallback, useRef } from "react";
import { WebSocketMessage } from "@/types";

interface UseWebSocketOptions {
  onMessage?: (data: string) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Create WebSocket connection
  const connect = useCallback(() => {
    // Close existing connection if any
    if (websocketRef.current) {
      websocketRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const socket = new WebSocket(wsUrl);
    websocketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    socket.onmessage = (event) => {
      try {
        // Try to parse as JSON first
        const data = JSON.parse(event.data);
        
        // Handle specific message types
        if (data.type === "subscribed") {
          console.log(`Successfully subscribed to run ${data.runId}`);
        } else if (data.error) {
          console.error("WebSocket error:", data.error);
        }
      } catch (e) {
        // Not JSON, treat as plain text (console output)
        setMessages(prev => [...prev, event.data]);
        if (onMessage) {
          onMessage(event.data);
        }
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
      setIsConnected(false);

      // Attempt to reconnect if enabled
      if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current += 1;
        console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
        
        if (reconnectTimeoutRef.current) {
          window.clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = window.setTimeout(connect, reconnectInterval);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
  }, [autoReconnect, maxReconnectAttempts, onMessage, reconnectInterval]);

  // Subscribe to a specific scenario run
  const subscribeToRun = useCallback((runId: number) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    const message: WebSocketSubscribeMessage = {
      type: "subscribe",
      runId,
    };

    websocketRef.current.send(JSON.stringify(message));
    setMessages([]); // Clear previous messages when subscribing to a new run
  }, []);

  // Send a message
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected");
      return;
    }

    websocketRef.current.send(JSON.stringify(message));
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    messages,
    subscribeToRun,
    sendMessage,
    connect,
  };
}
