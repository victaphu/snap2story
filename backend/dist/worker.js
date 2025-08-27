"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const imageWorker_1 = require("./workers/imageWorker");
// Load environment variables
dotenv_1.default.config();
const startWorker = async () => {
    try {
        console.log('🔧 Starting Image Generation Worker...');
        console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
        console.log(`👥 Concurrency: ${process.env.WORKER_CONCURRENCY || '2'}`);
        const worker = new imageWorker_1.ImageGenerationWorker();
        await worker.start();
        console.log('✅ Image Generation Worker started successfully');
        console.log('🎯 Worker is now listening for jobs...');
    }
    catch (error) {
        console.error('❌ Failed to start worker:', error);
        process.exit(1);
    }
};
// Start the worker
startWorker();
//# sourceMappingURL=worker.js.map