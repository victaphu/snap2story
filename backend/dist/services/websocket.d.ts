import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { JobProgress } from '../types/index';
export declare const initializeWebSocket: (httpServer: HttpServer) => SocketIOServer;
export declare const getWebSocketServer: () => SocketIOServer;
export declare const broadcastJobProgress: (jobId: string, progress: JobProgress) => void;
export declare const broadcastJobCompleted: (jobId: string, progress: JobProgress) => void;
export declare const broadcastJobFailed: (jobId: string, progress: JobProgress) => void;
//# sourceMappingURL=websocket.d.ts.map