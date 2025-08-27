import dotenv from 'dotenv';
import { ImageGenerationWorker } from './workers/imageWorker';

// Load environment variables
dotenv.config();

const startWorker = async () => {
  try {
    console.log('🔧 Starting Image Generation Worker...');
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Redis URL: ${process.env.REDIS_URL || 'redis://localhost:6379'}`);
    console.log(`👥 Concurrency: ${process.env.WORKER_CONCURRENCY || '2'}`);
    
    const worker = new ImageGenerationWorker();
    await worker.start();
    
    console.log('✅ Image Generation Worker started successfully');
    console.log('🎯 Worker is now listening for jobs...');
    
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
};

// Start the worker
startWorker();