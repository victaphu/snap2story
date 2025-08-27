import { Worker, Job } from 'bullmq';
import { ImageGenerationJobData, JobProgress } from '../types/index';
import { processWithProgress } from '../services/imageProcessor';
import { setJobProgress, redis, initializeRedis } from '../services/queue';

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

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const redisConnection = parseRedisUrl(redisUrl);

// Redis Pub/Sub for WebSocket broadcasting (industry standard approach)
const broadcastJobProgress = async (jobId: string, progress: JobProgress): Promise<void> => {
  try {
    const message = {
      type: 'job_progress',
      jobId,
      progress,
      timestamp: new Date().toISOString()
    };
    
    await redis.publish('websocket:broadcast', JSON.stringify(message));
    console.log(`📡 Redis Pub/Sub: Progress for job ${jobId}: ${progress.progress}%`);
  } catch (error) {
    console.error(`❌ Failed to publish progress for job ${jobId}:`, error);
  }
};

const broadcastJobCompleted = async (jobId: string, progress: JobProgress): Promise<void> => {
  try {
    const message = {
      type: 'job_completed',
      jobId,
      progress,
      timestamp: new Date().toISOString()
    };
    
    await redis.publish('websocket:broadcast', JSON.stringify(message));
    console.log(`📡 Redis Pub/Sub: Completion for job ${jobId}`);
  } catch (error) {
    console.error(`❌ Failed to publish completion for job ${jobId}:`, error);
  }
};

const broadcastJobFailed = async (jobId: string, progress: JobProgress): Promise<void> => {
  try {
    const message = {
      type: 'job_failed',
      jobId,
      progress,
      timestamp: new Date().toISOString()
    };
    
    await redis.publish('websocket:broadcast', JSON.stringify(message));
    console.log(`📡 Redis Pub/Sub: Failure for job ${jobId}`);
  } catch (error) {
    console.error(`❌ Failed to publish failure for job ${jobId}:`, error);
  }
};

export class ImageGenerationWorker {
  private worker: Worker<ImageGenerationJobData>;

  constructor() {
    this.worker = new Worker<ImageGenerationJobData>(
      'image-generation',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'), // Process 2 jobs simultaneously
        stalledInterval: 30000, // Check for stalled jobs every 30 seconds
        maxStalledCount: 1, // Retry stalled jobs once
      }
    );

    this.setupEventListeners();
  }

  private async processJob(job: Job<ImageGenerationJobData>): Promise<{ success: boolean; imageUrl?: string }> {
    const { jobId } = job.data;
    
    console.log(`🚀 Starting job processing: ${jobId}`);
    
    // Update progress function
    const updateProgress = async (progress: number, message: string) => {
      const progressData: JobProgress = {
        jobId,
        status: 'processing',
        progress,
        message,
        startedAt: new Date().toISOString(),
      };
      
      console.log(`📊 Progress update for ${jobId}: ${progress}% - ${message}`);
      await setJobProgress(jobId, progressData);
      broadcastJobProgress(jobId, progressData);
    };

    try {
      // Notify that job has been picked up from queue
      console.log(`📝 Job ${jobId} picked up from queue and starting processing`);
      await updateProgress(0, 'Job picked up from queue, starting processing...');
      
      // Process the image with progress updates
      const result = await processWithProgress(job.data, updateProgress);
      
      if (result.success && result.imageUrl) {
        // Mark as completed
        console.log(`✅ Job ${jobId} completed successfully`);
        const completedProgress: JobProgress = {
          jobId,
          status: 'completed',
          progress: 100,
          message: 'Image generation completed successfully!',
          imageUrl: result.imageUrl,
          previewData: result.previewData, // Include preview data
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        
        await setJobProgress(jobId, completedProgress);
        broadcastJobCompleted(jobId, completedProgress);
        
        console.log(`📡 WebSocket notification sent for completed job: ${jobId}`);
        return { success: true, imageUrl: result.imageUrl };
      } else {
        throw new Error(result.error || 'Image generation failed');
      }
    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error);
      
      // Mark as failed
      const failedProgress: JobProgress = {
        jobId,
        status: 'failed',
        progress: 0,
        message: 'Image generation failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };
      
      await setJobProgress(jobId, failedProgress);
      broadcastJobFailed(jobId, failedProgress);
      
      console.log(`📡 WebSocket notification sent for failed job: ${jobId}`);
      throw error; // Re-throw so BullMQ can handle retries
    }
  }

  private setupEventListeners(): void {
    this.worker.on('ready', () => {
      console.log('Image generation worker is ready');
    });

    this.worker.on('error', (error) => {
      console.error('Worker error:', error);
    });

    this.worker.on('failed', (job, error) => {
      if (job) {
        console.error(`Job ${job.data?.jobId} failed after ${job.attemptsMade} attempts:`, error);
      }
    });

    this.worker.on('completed', (job, result) => {
      if (job) {
        console.log(`Job ${job.data?.jobId} completed successfully`);
      }
    });

    this.worker.on('stalled', (jobId) => {
      console.warn(`Job ${jobId} stalled`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('Shutting down worker gracefully...');
      await this.worker.close();
      await redis.quit();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('Shutting down worker gracefully...');
      await this.worker.close();
      await redis.quit();
      process.exit(0);
    });
  }

  public async start(): Promise<void> {
    await initializeRedis();
    console.log('Image generation worker started');
    const isMockMode = (process.env.MOCK_PREVIEW || '').toLowerCase() === 'true';
    console.log('isMock', isMockMode);
    if (isMockMode) {
      console.log('Worker started with image mock')
    }
  }

  public async stop(): Promise<void> {
    await this.worker.close();
    await redis.quit();
    console.log('Image generation worker stopped');
  }
}