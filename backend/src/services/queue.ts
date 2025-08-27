import { Queue, Worker, Job } from 'bullmq';
import { createClient } from 'redis';
import { ImageGenerationJobData, JobProgress } from '../types/index';

// Redis connection configuration
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Parse Redis URL for BullMQ connection options
const parseRedisUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      password: parsed.password || undefined,
      username: parsed.username || undefined,
      db: parseInt(parsed.pathname.slice(1)) || 0,
    };
  } catch {
    return {
      host: 'localhost',
      port: 6379,
    };
  }
};

const redisConnection = parseRedisUrl(redisUrl);

// Redis client for direct operations
export const redis = createClient({ url: redisUrl });

// Initialize Redis connection
export const initializeRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log('Redis connected successfully');
  }
};

// Image Generation Queue
export const imageQueue = new Queue<ImageGenerationJobData>('image-generation', {
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
export const setJobProgress = async (jobId: string, progress: JobProgress): Promise<void> => {
  await redis.setEx(`job:${jobId}:progress`, 3600, JSON.stringify(progress)); // Expire in 1 hour
};

export const getJobProgress = async (jobId: string): Promise<JobProgress | null> => {
  const data = await redis.get(`job:${jobId}:progress`);
  return data ? JSON.parse(data) : null;
};

// Add job to queue
export const addImageGenerationJob = async (jobData: ImageGenerationJobData): Promise<void> => {
  await imageQueue.add('generate-image', jobData, {
    jobId: jobData.jobId,
  });

  // Set initial progress
  await setJobProgress(jobData.jobId, {
    jobId: jobData.jobId,
    status: 'queued',
    progress: 0,
    message: 'Job queued for processing',
    startedAt: new Date().toISOString(),
  });
};

// Get queue stats
export const getQueueStats = async () => {
  const waiting = await imageQueue.getWaiting();
  const active = await imageQueue.getActive();
  const completed = await imageQueue.getCompleted();
  const failed = await imageQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  };
};

// Clean up old jobs
export const cleanupOldJobs = async () => {
  await imageQueue.clean(24 * 60 * 60 * 1000, 0, 'completed'); // Clean completed jobs older than 24 hours
  await imageQueue.clean(7 * 24 * 60 * 60 * 1000, 0, 'failed'); // Clean failed jobs older than 7 days
};