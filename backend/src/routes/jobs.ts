import { Router, Request, Response } from 'express';
import { requireClerkAuth } from '../middleware/auth';
import { createNanoId } from '../utils/nanoid';
import { ImageGenerationJobData } from '../types/index';
import { addImageGenerationJob, getJobProgress, getQueueStats } from '../services/queue';

const router = Router();

// Create a new image generation job
router.post('/generate-image', requireClerkAuth, async (req: Request, res: Response) => {
  try {
    const {
      heroName,
      themeId,
      storyId,
      seriesKey,
      originalImageBase64,
      maskBase64,
      coverPromptOverride,
      ageGroup,
      length,
      styleKey,
      kind = 'cover',
      storyText,
      userId,
      // Extended context
      title,
      bookTitle,
      coverText,
      coverSpec,
      placeholders
    } = req.body;

    // Validate required fields
    if (!heroName || !originalImageBase64) {
      return res.status(400).json({
        error: 'Missing required fields: heroName and originalImageBase64 are required'
      });
    }

    const jobId = createNanoId();
    
    const jobData: ImageGenerationJobData = {
      jobId,
      heroName,
      themeId,
      storyId,
      seriesKey,
      originalImageBase64,
      maskBase64,
      coverPromptOverride,
      ageGroup,
      length,
      styleKey,
      kind,
      storyText,
      userId,
      // Prefer explicit bookTitle from client under either key
      bookTitle: (bookTitle ?? title ?? '').trim() || undefined,
      coverText: coverText ?? undefined,
      coverSpec: coverSpec ?? undefined,
      placeholders: placeholders ?? undefined,
      createdAt: new Date().toISOString()
    };

    // Add job to queue
    await addImageGenerationJob(jobData);

    res.status(202).json({
      jobId,
      status: 'queued',
      message: 'Image generation job queued successfully',
      statusUrl: `/api/jobs/${jobId}/status`,
      websocketSubscription: `job:${jobId}`
    });
    
  } catch (error) {
    console.error('Error creating image generation job:', error);
    res.status(500).json({
      error: 'Failed to create image generation job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get job status and progress
router.get('/:jobId/status', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    const progress = await getJobProgress(jobId);
    
    if (!progress) {
      return res.status(404).json({
        error: 'Job not found'
      });
    }

    res.json(progress);
    
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get queue statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getQueueStats();
    res.json(stats);
    
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      error: 'Failed to get queue statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'snap2story-backend'
  });
});

export default router;
