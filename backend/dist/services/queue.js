"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOldJobs = exports.getQueueStats = exports.addImageGenerationJob = exports.getJobProgress = exports.setJobProgress = exports.imageQueue = exports.initializeRedis = exports.redis = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("redis");
// Redis connection configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
// Parse Redis URL for BullMQ connection options
const parseRedisUrl = (url) => {
    try {
        const parsed = new URL(url);
        return {
            host: parsed.hostname,
            port: parseInt(parsed.port) || 6379,
            password: parsed.password || undefined,
            username: parsed.username || undefined,
            db: parseInt(parsed.pathname.slice(1)) || 0,
        };
    }
    catch {
        return {
            host: 'localhost',
            port: 6379,
        };
    }
};
const redisConnection = parseRedisUrl(redisUrl);
// Redis client for direct operations
exports.redis = (0, redis_1.createClient)({ url: redisUrl });
// Initialize Redis connection
const initializeRedis = async () => {
    if (!exports.redis.isOpen) {
        await exports.redis.connect();
        console.log('Redis connected successfully');
    }
};
exports.initializeRedis = initializeRedis;
// Image Generation Queue
exports.imageQueue = new bullmq_1.Queue('image-generation', {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 50, // Keep last 50 completed jobs
        removeOnFail: 100, // Keep last 100 failed jobs
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
    },
});
// Job progress storage
const setJobProgress = async (jobId, progress) => {
    await exports.redis.setEx(`job:${jobId}:progress`, 3600, JSON.stringify(progress)); // Expire in 1 hour
};
exports.setJobProgress = setJobProgress;
const getJobProgress = async (jobId) => {
    const data = await exports.redis.get(`job:${jobId}:progress`);
    return data ? JSON.parse(data) : null;
};
exports.getJobProgress = getJobProgress;
// Add job to queue
const addImageGenerationJob = async (jobData) => {
    await exports.imageQueue.add('generate-image', jobData, {
        jobId: jobData.jobId,
    });
    // Set initial progress
    await (0, exports.setJobProgress)(jobData.jobId, {
        jobId: jobData.jobId,
        status: 'queued',
        progress: 0,
        message: 'Job queued for processing',
        startedAt: new Date().toISOString(),
    });
};
exports.addImageGenerationJob = addImageGenerationJob;
// Get queue stats
const getQueueStats = async () => {
    const waiting = await exports.imageQueue.getWaiting();
    const active = await exports.imageQueue.getActive();
    const completed = await exports.imageQueue.getCompleted();
    const failed = await exports.imageQueue.getFailed();
    return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
    };
};
exports.getQueueStats = getQueueStats;
// Clean up old jobs
const cleanupOldJobs = async () => {
    await exports.imageQueue.clean(24 * 60 * 60 * 1000, 0, 'completed'); // Clean completed jobs older than 24 hours
    await exports.imageQueue.clean(7 * 24 * 60 * 60 * 1000, 0, 'failed'); // Clean failed jobs older than 7 days
};
exports.cleanupOldJobs = cleanupOldJobs;
//# sourceMappingURL=queue.js.map