import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import { initializeWebSocket } from './services/websocket';
import { initializeRedis } from './services/queue';
import Redis from 'ioredis';
import jobRoutes from './routes/jobs';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '50mb' })); // Allow large base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Trust proxy (Render/HEROKU) for accurate IPs in rate limiter
app.set('trust proxy', 1);

// Basic rate limiter for job routes
const jobsLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '30', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Routes
app.use('/api/jobs', jobsLimiter, jobRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'snap2story-backend',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/jobs/health',
      generateImage: 'POST /api/jobs/generate-image',
      jobStatus: 'GET /api/jobs/:jobId/status',
      queueStats: 'GET /api/jobs/stats',
      websocket: 'ws://localhost:' + PORT
    }
  });
});

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Initialize services and start server
const startServer = async () => {
  try {
    // Initialize Redis connection
    await initializeRedis();
    console.log('✅ Redis initialized');

    // Initialize WebSocket server
    const io = initializeWebSocket(httpServer);
    console.log('✅ WebSocket server initialized');

    // Setup Redis Pub/Sub subscriber to forward worker messages to WebSocket clients
    const setupRedisSubscriber = () => {
      console.log('🔔 Setting up Redis subscriber for WebSocket broadcasting...');
      
      // Create separate Redis connection for subscriber
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const subscriberRedis = new Redis(redisUrl);
      
      subscriberRedis.subscribe('websocket:broadcast', (err, count) => {
        if (err) {
          console.error('❌ Failed to subscribe to websocket:broadcast:', err);
          return;
        }
        console.log(`✅ Subscribed to websocket:broadcast channel (${count} total subscriptions)`);
      });

      subscriberRedis.on('message', (channel: string, message: string) => {
        if (channel === 'websocket:broadcast') {
          try {
            const data = JSON.parse(message);
            const { type, jobId, progress } = data;
            
            console.log(`📡 Redis message received: ${type} for job ${jobId}`);
            
            // Forward message to WebSocket clients subscribed to this job
            const room = `job:${jobId}`;
            const wsMessage = {
              type,
              jobId,
              progress,
              timestamp: data.timestamp || new Date().toISOString()
            };
            
            io.to(room).emit('message', wsMessage);
            console.log(`🎯 WebSocket message sent to room ${room}: ${type}`);
            
          } catch (error) {
            console.error('❌ Failed to parse Redis message:', error);
          }
        }
      });

      subscriberRedis.on('error', (error) => {
        console.error('❌ Redis subscriber error:', error);
      });
    };

    // Start Redis subscriber
    setupRedisSubscriber();

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 WebSocket server ready`);
      console.log(`🌐 CORS origins: ${corsOrigins.join(', ')}`);
      console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n📴 Received ${signal}, shutting down gracefully...`);
      
      httpServer.close(() => {
        console.log('🔌 HTTP server closed');
      });

      io.close(() => {
        console.log('🔌 WebSocket server closed');
      });

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
