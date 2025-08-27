"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const websocket_1 = require("./services/websocket");
const queue_1 = require("./services/queue");
const ioredis_1 = __importDefault(require("ioredis"));
const jobs_1 = __importDefault(require("./routes/jobs"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const PORT = process.env.PORT || 3001;
// Middleware
app.use(express_1.default.json({ limit: '50mb' })); // Allow large base64 images
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use((0, cors_1.default)({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));
// Routes
app.use('/api/jobs', jobs_1.default);
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
app.use((error, req, res, next) => {
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
        await (0, queue_1.initializeRedis)();
        console.log('✅ Redis initialized');
        // Initialize WebSocket server
        const io = (0, websocket_1.initializeWebSocket)(httpServer);
        console.log('✅ WebSocket server initialized');
        // Setup Redis Pub/Sub subscriber to forward worker messages to WebSocket clients
        const setupRedisSubscriber = () => {
            console.log('🔔 Setting up Redis subscriber for WebSocket broadcasting...');
            // Create separate Redis connection for subscriber
            const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
            const subscriberRedis = new ioredis_1.default(redisUrl);
            subscriberRedis.subscribe('websocket:broadcast', (err, count) => {
                if (err) {
                    console.error('❌ Failed to subscribe to websocket:broadcast:', err);
                    return;
                }
                console.log(`✅ Subscribed to websocket:broadcast channel (${count} total subscriptions)`);
            });
            subscriberRedis.on('message', (channel, message) => {
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
                    }
                    catch (error) {
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
        const gracefulShutdown = async (signal) => {
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
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=server.js.map