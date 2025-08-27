import { io, Socket } from 'socket.io-client';

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  imageUrl?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  previewData?: any; // Preview data returned when job completes
}

export interface WebSocketMessage {
  type: 'job_progress' | 'job_completed' | 'job_failed' | 'connection_confirmed';
  jobId?: string;
  progress?: JobProgress;
  data?: any;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private backendUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  connect(): Promise<void> {
    // console.log(`🔌 Attempting to connect to WebSocket: ${this.backendUrl}`);
    
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        // console.log('✅ Already connected to WebSocket');
        resolve();
        return;
      }
      if (this.isConnecting) {
        // Avoid parallel connects
        const wait = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(wait);
            resolve();
          }
        }, 100);
        return;
      }

      const wsPath = process.env.NEXT_PUBLIC_WS_PATH || undefined; // e.g., '/socket.io'
      this.isConnecting = true;
      this.socket = io(this.backendUrl, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        // Do not force a new socket; reuse existing connection
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 10,
        path: wsPath,
        withCredentials: true,
      });

      this.socket.on('connect', () => {
        console.log('✅ Connected to backend WebSocket, socket ID:', this.socket?.id);
        this.reconnectAttempts = 0;
        this.isConnecting = false;
        
        // Re-subscribe to any active jobs stored in session
        this.resubscribeToActiveJobs();
        
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
        // Let socket.io auto-reconnect; avoid creating multiple clients
        this.isConnecting = false;
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('❌ Max reconnection attempts reached');
          reject(error);
        }
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket:', reason);
        // Socket.io will auto-reconnect unless the disconnection was initiated by the server with io.disconnect()
      });

      // Generic socket.io 'message' channel envelope
      this.socket.on('message', (message: WebSocketMessage) => {
        console.log('📨 WS message (envelope):', message);
        this.handleMessage(message);
      });

      // Explicit job channels from backend
      this.socket.on('job_progress', (progress: JobProgress) => {
        console.log('📈 WS job_progress:', progress);
        this.handleMessage({ type: 'job_progress', progress });
      });
      this.socket.on('job_completed', (progress: JobProgress) => {
        console.log('✅ WS job_completed:', progress);
        this.handleMessage({ type: 'job_completed', progress });
      });
      this.socket.on('job_failed', (progress: JobProgress) => {
        console.log('❌ WS job_failed:', progress);
        this.handleMessage({ type: 'job_failed', progress });
      });

      // Debug: log any other events to help diagnose silent failures
      if (this.socket.onAny) {
        this.socket.onAny((event: string, ...args: any[]) => {
          if (event !== 'message' && event !== 'job_progress' && event !== 'job_completed' && event !== 'job_failed') {
            console.log('🔔 WS event:', event, args);
          }
        });
      }

      // Add more debugging events
      this.socket.on('reconnect', (attemptNumber) => {
        console.log('🔄 WebSocket reconnected after', attemptNumber, 'attempts');
        // Re-subscribe to active jobs after reconnection
        this.resubscribeToActiveJobs();
      });

      this.socket.on('reconnect_error', (error) => {
        console.error('❌ WebSocket reconnection error:', error);
      });

      this.socket.on('reconnect_failed', () => {
        console.error('❌ WebSocket reconnection failed permanently');
      });
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 Received WebSocket message:', message);
    
    // Emit custom events for different message types
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent('websocket-message', {
        detail: message
      });
      window.dispatchEvent(customEvent);
    }
  }

  private resubscribeToActiveJobs(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Check for any active jobs in sessionStorage
      const activeJob = sessionStorage.getItem('snap2story_active_job');
      if (activeJob) {
        const jobInfo = JSON.parse(activeJob);
        const age = Date.now() - jobInfo.timestamp;
        
        // Only resubscribe if job is less than 10 minutes old
        if (age < 10 * 60 * 1000) {
          console.log(`🔄 Re-subscribing to active job: ${jobInfo.jobId}`);
          this.subscribeToJob(jobInfo.jobId);
        }
      }
    } catch (error) {
      console.error('Failed to resubscribe to active jobs:', error);
    }
  }

  subscribeToJob(jobId: string): void {
    if (this.socket?.connected) {
      console.log(`🎯 Subscribing to job: ${jobId}`);
      // Subscribe with confirmation callback (primary channel)
      this.socket.emit('subscribe_to_job', jobId, (ack: any) => {
        console.log(`✅ subscribe_to_job ack for ${jobId}:`, ack);
      });
      // Fallback channel used by some servers
      this.socket.emit('subscribe', jobId, (ack: any) => {
        console.log(`✅ subscribe ack for ${jobId}:`, ack);
      });
      // Also try object payload shape
      this.socket.emit('subscribe_to_job', { jobId }, (ack: any) => {
        console.log(`✅ subscribe_to_job(object) ack for ${jobId}:`, ack);
      });
      this.socket.emit('subscribe', { jobId }, (ack: any) => {
        console.log(`✅ subscribe(object) ack for ${jobId}:`, ack);
      });

      // Dynamic per-job event listeners
      try {
        this.socket.off(jobId);
        this.socket.off(`job:${jobId}`);
        this.socket.off(`progress:${jobId}`);
        this.socket.off(`completed:${jobId}`);
        this.socket.off(`failed:${jobId}`);
      } catch {}

      this.socket.on(jobId, (payload: any) => {
        console.log('🔔 WS event(jobId):', jobId, payload);
        // Normalize
        if (payload?.type && payload?.progress) {
          this.handleMessage(payload as WebSocketMessage);
        } else if (payload?.status) {
          // Guess by status
          const type = payload.status === 'completed' ? 'job_completed'
            : payload.status === 'failed' ? 'job_failed' : 'job_progress';
          this.handleMessage({ type, progress: payload });
        }
      });
      this.socket.on(`job:${jobId}`, (payload: any) => {
        console.log('🔔 WS event(job:jobId):', payload);
        const type = payload?.type || (payload?.status === 'completed' ? 'job_completed' : payload?.status === 'failed' ? 'job_failed' : 'job_progress');
        this.handleMessage({ type, progress: payload.progress || payload });
      });
      this.socket.on(`progress:${jobId}`, (progress: JobProgress) => {
        console.log('📈 WS progress:jobId', progress);
        this.handleMessage({ type: 'job_progress', progress });
      });
      this.socket.on(`completed:${jobId}`, (progress: JobProgress) => {
        console.log('✅ WS completed:jobId', progress);
        this.handleMessage({ type: 'job_completed', progress });
      });
      this.socket.on(`failed:${jobId}`, (progress: JobProgress) => {
        console.log('❌ WS failed:jobId', progress);
        this.handleMessage({ type: 'job_failed', progress });
      });
    } else {
      console.warn(`⚠️ Cannot subscribe to job ${jobId}: WebSocket not connected`);
    }
  }

  unsubscribeFromJob(jobId: string): void {
    if (this.socket?.connected) {
      console.log(`❌ Unsubscribing from job: ${jobId}`);
      this.socket.emit('unsubscribe_from_job', jobId);
      this.socket.emit('unsubscribe', jobId);
    } else {
      console.warn(`⚠️ Cannot unsubscribe from job ${jobId}: WebSocket not connected`);
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🔌 WebSocket disconnected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Listen for job progress updates
  onJobProgress(callback: (progress: JobProgress) => void): () => void {
    const handler = (event: CustomEvent<WebSocketMessage>) => {
      const message = event.detail;
      if (message.type === 'job_progress' && message.progress) {
        callback(message.progress);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('websocket-message', handler as EventListener);
      
      // Return cleanup function
      return () => {
        window.removeEventListener('websocket-message', handler as EventListener);
      };
    }

    return () => {};
  }

  // Listen for job completion
  onJobCompleted(callback: (progress: JobProgress) => void): () => void {
    const handler = (event: CustomEvent<WebSocketMessage>) => {
      const message = event.detail;
      if (message.type === 'job_completed' && message.progress) {
        callback(message.progress);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('websocket-message', handler as EventListener);
      
      return () => {
        window.removeEventListener('websocket-message', handler as EventListener);
      };
    }

    return () => {};
  }

  // Listen for job failures
  onJobFailed(callback: (progress: JobProgress) => void): () => void {
    const handler = (event: CustomEvent<WebSocketMessage>) => {
      const message = event.detail;
      if (message.type === 'job_failed' && message.progress) {
        callback(message.progress);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('websocket-message', handler as EventListener);
      
      return () => {
        window.removeEventListener('websocket-message', handler as EventListener);
      };
    }

    return () => {};
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
