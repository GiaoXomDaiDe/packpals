import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

export interface NotificationMessage {
  orderId?: string;
  storageId?: string;
  customerName?: string;
  keeperName?: string;
  itemCount?: number;
  totalAmount?: number;
  oldStatus?: string;
  newStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  message?: string;
}

export interface PendingCountUpdate {
  keeperId: string;
  pendingCount: number;
}

export type NotificationHandler = (message: NotificationMessage) => void;
export type PendingCountHandler = (data: PendingCountUpdate) => void;

class SignalRService {
  private connection: HubConnection | null = null;
  private keeperId: string | null = null;
  private renterId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event handlers
  private onNewOrderHandlers: NotificationHandler[] = [];
  private onOrderStatusChangeHandlers: NotificationHandler[] = [];
  private onPendingCountUpdateHandlers: PendingCountHandler[] = [];

  /**
   * Initialize SignalR connection
   * @param baseUrl - Backend server URL (e.g., 'http://localhost:5111')
   */
  async initialize(baseUrl: string = 'http://192.168.43.112:5000'): Promise<boolean> {
    try {
      if (this.connection?.state === 'Connected') {
        console.log('SignalR already connected');
        return true;
      }
      console.log('Initializing SignalR connection to:', baseUrl);
      // Test server connectivity first - Fixed for React Native
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${baseUrl}/swagger/index.html`, { 
          method: 'HEAD',
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`⚠️ Backend server not responding at ${baseUrl}`);
        }
      } catch (error) {
        console.warn(`⚠️ Cannot reach backend server at ${baseUrl}:`, error);
        // Don't return false here - still try SignalR connection
        console.log('Attempting SignalR connection anyway...');
      }

      this.connection = new HubConnectionBuilder()
        .withUrl(`${baseUrl}/hubs/keeper-notifications`, {
          skipNegotiation: false,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            if (retryContext.previousRetryCount < this.maxReconnectAttempts) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            }
            return null; // Stop reconnecting
          }
        })
        .configureLogging(LogLevel.Information)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Setup connection lifecycle handlers
      this.setupConnectionHandlers();

      // Start connection
      await this.connection.start();
      console.log('✅ SignalR connected successfully');
      this.reconnectAttempts = 0;
      
      return true;
    } catch (error) {
      console.error('❌ SignalR connection failed:', error);
      return false;
    }
  }

  /**
   * Join keeper group to receive notifications
   * @param keeperId - Keeper's ID (GUID string)
   */
  async joinKeeperGroup(keeperId: string): Promise<boolean> {
    try {
      if (!this.connection || this.connection.state !== 'Connected') {
        console.error('SignalR not connected');
        return false;
      }

      await this.connection.invoke('JoinKeeperGroup', keeperId);
      this.keeperId = keeperId;
      console.log(`✅ Joined keeper group: Keeper_${keeperId}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join keeper group:', error);
      return false;
    }
  }

  /**
   * Leave current keeper group
   */
  async leaveKeeperGroup(): Promise<boolean> {
    try {
      if (!this.connection || !this.keeperId) {
        return true;
      }

      await this.connection.invoke('LeaveKeeperGroup', this.keeperId);
      console.log(`✅ Left keeper group: Keeper_${this.keeperId}`);
      this.keeperId = null;
      
      return true;
    } catch (error) {
      console.error('❌ Failed to leave keeper group:', error);
      return false;
    }
  }

  /**
   * Join renter group to receive order status notifications
   * @param renterId - Renter's ID (GUID string)
   */
  async joinRenterGroup(renterId: string): Promise<boolean> {
    try {
      if (!this.connection || this.connection.state !== 'Connected') {
        console.error('SignalR not connected');
        return false;
      }

      await this.connection.invoke('JoinRenterGroup', renterId);
      this.renterId = renterId;
      console.log(`✅ Joined renter group: Renter_${renterId}`);
      
      return true;
    } catch (error) {
      console.error('❌ Failed to join renter group:', error);
      return false;
    }
  }

  /**
   * Leave current renter group
   */
  async leaveRenterGroup(): Promise<boolean> {
    try {
      if (!this.connection || !this.renterId) {
        return true;
      }

      await this.connection.invoke('LeaveRenterGroup', this.renterId);
      console.log(`✅ Left renter group: Renter_${this.renterId}`);
      this.renterId = null;
      
      return true;
    } catch (error) {
      console.error('❌ Failed to leave renter group:', error);
      return false;
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    try {
      if (this.connection) {
        await this.leaveKeeperGroup();
        await this.leaveRenterGroup();
        await this.connection.stop();
        console.log('✅ SignalR disconnected');
      }
    } catch (error) {
      console.error('❌ SignalR disconnect error:', error);
    }
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.connection?.state === 'Connected';
  }

  get currentKeeperId(): string | null {
    return this.keeperId;
  }

  // Event handler registration methods
  onNewOrder(handler: NotificationHandler): () => void {
    this.onNewOrderHandlers.push(handler);
    return () => {
      const index = this.onNewOrderHandlers.indexOf(handler);
      if (index > -1) {
        this.onNewOrderHandlers.splice(index, 1);
      }
    };
  }

  onOrderStatusChange(handler: NotificationHandler): () => void {
    this.onOrderStatusChangeHandlers.push(handler);
    return () => {
      const index = this.onOrderStatusChangeHandlers.indexOf(handler);
      if (index > -1) {
        this.onOrderStatusChangeHandlers.splice(index, 1);
      }
    };
  }

  onPendingCountUpdate(handler: PendingCountHandler): () => void {
    this.onPendingCountUpdateHandlers.push(handler);
    return () => {
      const index = this.onPendingCountUpdateHandlers.indexOf(handler);
      if (index > -1) {
        this.onPendingCountUpdateHandlers.splice(index, 1);
      }
    };
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Handle new order notifications
    this.connection.on('NewOrderReceived', (notification: any) => {
      console.log('🆕 New order received:', notification);
      
      // Transform backend structure to expected frontend structure
      const message: NotificationMessage = {
        ...notification.Data,
        message: notification.Message,
        createdAt: notification.Timestamp
      };
      
      this.onNewOrderHandlers.forEach(handler => handler(message));
    });

    // Handle order status change notifications
    this.connection.on('OrderStatusChanged', (notification: any) => {
      console.log('🔄 Order status changed:', notification);
      
      // Transform backend structure to expected frontend structure
      const message: NotificationMessage = {
        orderId: notification.Data?.OrderId,
        newStatus: notification.Data?.NewStatus,
        customerName: notification.Data?.CustomerName,
        message: notification.Message,
        createdAt: notification.Timestamp || notification.Data?.Timestamp
      };
      
      this.onOrderStatusChangeHandlers.forEach(handler => handler(message));
    });

    // Handle pending count updates
    this.connection.on('PendingCountUpdated', (notification: any) => {
      console.log('📊 Pending count updated:', notification);
      
      // Transform backend structure to expected frontend structure
      const data: PendingCountUpdate = {
        keeperId: '', // Backend doesn't send this in notification
        pendingCount: notification.Data?.PendingOrdersCount || 0
      };
      
      this.onPendingCountUpdateHandlers.forEach(handler => handler(data));
    });
  }

  private setupConnectionHandlers(): void {
    if (!this.connection) return;

    this.connection.onclose((error) => {
      console.log('🔌 SignalR connection closed:', error?.message || 'No error');
    });

    this.connection.onreconnecting((error) => {
      console.log('🔄 SignalR reconnecting:', error?.message || 'No error');
      this.reconnectAttempts++;
    });

    this.connection.onreconnected((connectionId) => {
      console.log('✅ SignalR reconnected:', connectionId);
      this.reconnectAttempts = 0;
      
      // Rejoin keeper group if we were in one
      if (this.keeperId) {
        this.joinKeeperGroup(this.keeperId);
      }
      // Rejoin renter group if we were in one
      if (this.renterId) {
        this.joinRenterGroup(this.renterId);
      }
    });
  }
}

// Export singleton instance
export const signalRService = new SignalRService();
export default signalRService;
