/**
 * Binance Testnet WebSocket Service
 * Provides real-time updates for account, orders, and prices without REST API polling
 * This eliminates rate limiting issues by using WebSocket streams
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface TickerUpdate {
  symbol: string;
  price: number;
  priceChangePercent: number;
}

interface OrderUpdate {
  orderId: number;
  symbol: string;
  side: "BUY" | "SELL";
  type: string;
  status: string;
  quantity: number;
  price: number;
  executedQuantity: number;
  timestamp: number;
}

interface BalanceUpdate {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

type TickerCallback = (ticker: TickerUpdate) => void;
type OrderCallback = (order: OrderUpdate) => void;
type BalanceCallback = (balances: BalanceUpdate[]) => void;

class BinanceWebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isIntentionallyClosed = false;
  private listenKey: string | null = null;
  
  private tickerCallbacks = new Set<TickerCallback>();
  private orderCallbacks = new Set<OrderCallback>();
  private balanceCallbacks = new Set<BalanceCallback>();
  
  private subscribedSymbols = new Set<string>();
  private keepAliveInterval: NodeJS.Timeout | null = null;

  /**
   * Connect to Binance testnet WebSocket
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.isIntentionallyClosed = false;

    try {
      // Get listen key from backend for user data stream
      console.log('Requesting WebSocket listen key from backend...');
      const response = await fetch(`${API_BASE_URL}/binance-testnet/websocket/listen-key`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        let errorMsg = 'Failed to get WebSocket listen key';
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
          console.error('Backend error:', errorData);
        } catch {
          errorMsg = `${errorMsg}: ${response.statusText}`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      this.listenKey = data.listenKey;
      console.log('Listen key obtained successfully');

      // Connect to user data stream
      const wsUrl = `wss://stream.testnet.binance.vision:9443/ws/${this.listenKey}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Binance WebSocket connected');
        this.reconnectAttempts = 0;
        this.startKeepAlive();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket closed');
        this.stopKeepAlive();
        
        if (!this.isIntentionallyClosed) {
          this.reconnect();
        }
      };
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      this.reconnect();
    }
  }

  /**
   * Keep-alive mechanism to maintain the listen key
   */
  private startKeepAlive(): void {
    // Ping listen key every 30 minutes to keep it alive
    this.keepAliveInterval = setInterval(async () => {
      try {
        await fetch(`${API_BASE_URL}/binance-testnet/websocket/listen-key`, {
          method: 'PUT',
          credentials: 'include',
        });
        console.log('WebSocket listen key refreshed');
      } catch (err) {
        console.error('Failed to refresh listen key:', err);
      }
    }, 30 * 60 * 1000); // 30 minutes
  }

  private stopKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: any): void {
    const eventType = message.e;

    switch (eventType) {
      case 'executionReport': // Order update
        this.handleOrderUpdate(message);
        break;
      
      case 'outboundAccountPosition': // Balance update
        this.handleBalanceUpdate(message);
        break;
      
      case '24hrTicker': // Ticker update
        this.handleTickerUpdate(message);
        break;
      
      default:
        // console.log('Unknown event type:', eventType, message);
        break;
    }
  }

  /**
   * Handle order updates from execution reports
   */
  private handleOrderUpdate(message: any): void {
    const order: OrderUpdate = {
      orderId: message.i,
      symbol: message.s,
      side: message.S,
      type: message.o,
      status: message.X,
      quantity: parseFloat(message.q),
      price: parseFloat(message.p),
      executedQuantity: parseFloat(message.z),
      timestamp: message.T,
    };

    this.orderCallbacks.forEach(cb => cb(order));
  }

  /**
   * Handle balance updates
   */
  private handleBalanceUpdate(message: any): void {
    if (!message.B || !Array.isArray(message.B)) return;

    const balances: BalanceUpdate[] = message.B.map((b: any) => ({
      asset: b.a,
      free: parseFloat(b.f),
      locked: parseFloat(b.l),
      total: parseFloat(b.f) + parseFloat(b.l),
    }));

    this.balanceCallbacks.forEach(cb => cb(balances));
  }

  /**
   * Handle ticker price updates
   */
  private handleTickerUpdate(message: any): void {
    const ticker: TickerUpdate = {
      symbol: message.s,
      price: parseFloat(message.c),
      priceChangePercent: parseFloat(message.P),
    };

    this.tickerCallbacks.forEach(cb => cb(ticker));
  }

  /**
   * Subscribe to ticker updates for specific symbols
   */
  async subscribeToTickers(symbols: string[]): Promise<void> {
    // For testnet, we'd need a separate WebSocket connection for market data
    // User data stream only provides account/order updates
    // For now, we'll keep REST API for ticker data but at much lower frequency
    symbols.forEach(s => this.subscribedSymbols.add(s));
  }

  /**
   * Register callback for ticker updates
   */
  onTickerUpdate(callback: TickerCallback): () => void {
    this.tickerCallbacks.add(callback);
    return () => this.tickerCallbacks.delete(callback);
  }

  /**
   * Register callback for order updates
   */
  onOrderUpdate(callback: OrderCallback): () => void {
    this.orderCallbacks.add(callback);
    return () => this.orderCallbacks.delete(callback);
  }

  /**
   * Register callback for balance updates
   */
  onBalanceUpdate(callback: BalanceCallback): () => void {
    this.balanceCallbacks.add(callback);
    return () => this.balanceCallbacks.delete(callback);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopKeepAlive();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    if (this.listenKey) {
      // Close listen key on backend
      fetch(`${API_BASE_URL}/binance-testnet/websocket/listen-key`, {
        method: 'DELETE',
        credentials: 'include',
      }).catch(err => console.error('Failed to close listen key:', err));
      
      this.listenKey = null;
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const binanceWebSocketService = new BinanceWebSocketService();
