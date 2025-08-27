import { JobProgress } from './websocket-client';

export interface ImageGenerationRequest {
  heroName: string;
  themeId?: string;
  storyId?: string;
  seriesKey?: string;
  originalImageBase64: string;
  maskBase64?: string;
  coverPromptOverride?: string;
  ageGroup?: string;
  length?: number;
  styleKey?: string;
  kind: 'cover' | 'interior' | 'dedication';
  storyText?: string;
  userId?: string;
  // Extended context for richer cover generation
  placeholders?: Record<string, string>;
  title?: string;
  coverText?: string;
  coverSpec?: any; // structured page 0 data (kind: 'title', imageDescription, etc.)
}

export interface JobResponse {
  jobId: string;
  status: string;
  message: string;
  statusUrl: string;
  websocketSubscription: string;
}

class QueueClient {
  private backendUrl: string;

  constructor() {
    this.backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  }

  async generateImage(request: ImageGenerationRequest): Promise<JobResponse> {
    const response = await fetch(`${this.backendUrl}/api/jobs/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getJobStatus(jobId: string): Promise<JobProgress> {
    const response = await fetch(`${this.backendUrl}/api/jobs/${jobId}/status`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const response = await fetch(`${this.backendUrl}/api/jobs/stats`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await fetch(`${this.backendUrl}/api/jobs/health`);

    if (!response.ok) {
      throw new Error(`Health check failed: HTTP ${response.status}`);
    }

    return await response.json();
  }

  // Poll for job completion (fallback if WebSocket fails)
  async pollForCompletion(
    jobId: string,
    onProgress?: (progress: JobProgress) => void,
    timeout: number = 300000 // 5 minutes
  ): Promise<JobProgress> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          if (Date.now() - startTime > timeout) {
            reject(new Error('Job polling timed out'));
            return;
          }

          const progress = await this.getJobStatus(jobId);
          
          if (onProgress) {
            onProgress(progress);
          }

          if (progress.status === 'completed') {
            resolve(progress);
          } else if (progress.status === 'failed') {
            reject(new Error(progress.error || 'Job failed'));
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }
}

export const queueClient = new QueueClient();
