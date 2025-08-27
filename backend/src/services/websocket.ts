import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { WebSocketMessage, JobProgress } from '../types/index';

let io: SocketIOServer;

export const initializeWebSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '60000'),
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
  });

  io.on('connection', (socket: Socket) => {
    console.log(`✅ Client connected: ${socket.id} from ${socket.handshake.address}`);

    // Send connection confirmation
    const confirmationMessage: WebSocketMessage = {
      type: 'connection_confirmed',
      data: { socketId: socket.id, timestamp: new Date().toISOString() },
    };
    console.log(`📡 Sending connection confirmation to ${socket.id}`);
    socket.emit('message', confirmationMessage);

    // Handle job subscription
    socket.on('subscribe_to_job', (jobId: string, callback?: Function) => {
      console.log(`🎯 Client ${socket.id} subscribed to job ${jobId}`);
      socket.join(`job:${jobId}`);
      
      // Send acknowledgment if callback provided
      if (callback) {
        callback({ status: 'subscribed', jobId, socketId: socket.id });
      }
      
      // Confirm subscription
      console.log(`✅ Client ${socket.id} joined room: job:${jobId}`);
    });

    // Handle job unsubscription
    socket.on('unsubscribe_from_job', (jobId: string) => {
      console.log(`❌ Client ${socket.id} unsubscribed from job ${jobId}`);
      socket.leave(`job:${jobId}`);
      console.log(`✅ Client ${socket.id} left room: job:${jobId}`);
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Handle ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
};

export const getWebSocketServer = (): SocketIOServer => {
  if (!io) {
    throw new Error('WebSocket server not initialized');
  }
  return io;
};

// Send job progress update to subscribed clients
export const broadcastJobProgress = (jobId: string, progress: JobProgress): void => {
  if (!io) {
    console.error('❌ WebSocket server not initialized, cannot broadcast progress');
    return;
  }

  const message: WebSocketMessage = {
    type: 'job_progress',
    jobId,
    progress,
  };

  const roomName = `job:${jobId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientCount = room ? room.size : 0;
  
  console.log(`📊 Broadcasting progress for job ${jobId}: ${progress.progress}% to ${clientCount} clients in room ${roomName}`);
  io.to(roomName).emit('message', message);
  
  if (clientCount === 0) {
    console.warn(`⚠️ No clients subscribed to job ${jobId}`);
  }
};

// Send job completion notification
export const broadcastJobCompleted = (jobId: string, progress: JobProgress): void => {
  if (!io) {
    console.error('❌ WebSocket server not initialized, cannot broadcast completion');
    return;
  }

  const message: WebSocketMessage = {
    type: 'job_completed',
    jobId,
    progress,
  };

  const roomName = `job:${jobId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientCount = room ? room.size : 0;
  
  console.log(`✅ Broadcasting completion for job ${jobId} to ${clientCount} clients in room ${roomName}`);
  io.to(roomName).emit('message', message);
  
  if (clientCount === 0) {
    console.warn(`⚠️ No clients subscribed to completed job ${jobId}`);
  }
};

// Send job failure notification
export const broadcastJobFailed = (jobId: string, progress: JobProgress): void => {
  if (!io) {
    console.error('❌ WebSocket server not initialized, cannot broadcast failure');
    return;
  }

  const message: WebSocketMessage = {
    type: 'job_failed',
    jobId,
    progress,
  };

  const roomName = `job:${jobId}`;
  const room = io.sockets.adapter.rooms.get(roomName);
  const clientCount = room ? room.size : 0;
  
  console.log(`❌ Broadcasting failure for job ${jobId} to ${clientCount} clients in room ${roomName}`);
  io.to(roomName).emit('message', message);
  
  if (clientCount === 0) {
    console.warn(`⚠️ No clients subscribed to failed job ${jobId}`);
  }
};