import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface BalanceUpdate {
  asset: string;
  free: string;
  locked: string;
  timestamp: number;
}

interface OrderUpdate {
  orderId: string;
  clientOrderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  status: 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED';
  price: string;
  quantity: string;
  executedQuantity: string;
  cumulativeQuoteQuantity: string;
  timestamp: number;
}

interface ConnectionStatus {
  connected: boolean;
  message?: string;
}

interface UseRealtimePaperTrading {
  connected: boolean;
  balance: Record<string, { free: string; locked: string }> | null;
  orders: OrderUpdate[];
  connectionStatus: ConnectionStatus;
  reconnecting: boolean;
  error: string | null;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000;

export function useRealtimePaperTrading(userId: string = 'default-user'): UseRealtimePaperTrading {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [balance, setBalance] = useState<Record<string, { free: string; locked: string }> | null>(null);
  const [orders, setOrders] = useState<OrderUpdate[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ connected: false });
  const [error, setError] = useState<string | null>(null);
  
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('User ID is required');
      return;
    }

    // Create Socket.IO connection
    const newSocket = io(`${SOCKET_URL}/paper-trading`, {
      auth: { userId },
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    // Connection established
    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected to paper trading');
      setConnected(true);
      setReconnecting(false);
      setError(null);
      reconnectAttempts.current = 0;
      
      // Subscribe to account data stream
      newSocket.emit('subscribe:account');
    });

    // Connection lost
    newSocket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setConnected(false);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, manually reconnect
        setReconnecting(true);
      }
    });

    // Reconnection attempt
    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`[WebSocket] Reconnection attempt ${attempt}`);
      setReconnecting(true);
      reconnectAttempts.current = attempt;
    });

    // Reconnection failed
    newSocket.on('reconnect_failed', () => {
      console.error('[WebSocket] Reconnection failed after all attempts');
      setError('Failed to reconnect to server');
      setReconnecting(false);
    });

    // Reconnected successfully
    newSocket.on('reconnect', (attempt) => {
      console.log(`[WebSocket] Reconnected after ${attempt} attempts`);
      setReconnecting(false);
      reconnectAttempts.current = 0;
    });

    // Connection error
    newSocket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err.message);
      setError(`Connection error: ${err.message}`);
    });

    // Connection status updates from server
    newSocket.on('connection:status', (data: ConnectionStatus) => {
      console.log('[WebSocket] Status update:', data);
      setConnectionStatus(data);
      if (data.connected === false) {
        setError(data.message || 'Disconnected from data stream');
      }
    });

    // Balance updates
    newSocket.on('balance:update', (data: BalanceUpdate) => {
      console.log('[WebSocket] Balance update:', data);
      setBalance((prev) => ({
        ...prev,
        [data.asset]: {
          free: data.free,
          locked: data.locked,
        },
      }));
    });

    // Order updates
    newSocket.on('order:update', (data: OrderUpdate) => {
      console.log('[WebSocket] Order update:', data);
      setOrders((prev) => {
        // Check if order already exists
        const existingIndex = prev.findIndex((o) => o.orderId === data.orderId);
        
        if (existingIndex >= 0) {
          // Update existing order
          const updated = [...prev];
          updated[existingIndex] = data;
          return updated;
        } else {
          // Add new order
          return [data, ...prev];
        }
      });
    });

    // Error events from server
    newSocket.on('error', (data: { code: string; message: string }) => {
      console.error('[WebSocket] Server error:', data);
      setError(`${data.code}: ${data.message}`);
      
      // If rate limited, stop trying to reconnect
      if (data.code === 'RATE_LIMITED') {
        console.warn('⛔ Rate limit detected - stopping reconnection attempts');
        reconnectAttempts.current = RECONNECT_ATTEMPTS; // Max out attempts to stop reconnects
        setReconnecting(false);
        setConnected(false);
      }
    });

    // Pong response (for health check)
    newSocket.on('pong', (data) => {
      console.log('[WebSocket] Pong received:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      console.log('[WebSocket] Cleaning up connection');
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
      newSocket.emit('unsubscribe:account');
      newSocket.close();
    };
  }, [userId]);

  return {
    connected,
    balance,
    orders,
    connectionStatus,
    reconnecting,
    error,
  };
}
