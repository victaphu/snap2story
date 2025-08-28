import { useState, useEffect, useCallback, useRef } from 'react';
import { queueClient, ImageGenerationRequest, JobResponse } from '@/lib/services/queue-client';
import { wsClient, JobProgress } from '@/lib/services/websocket-client';
import { useAuth } from '@clerk/nextjs';

interface UseImageGenerationOptions {
  onProgress?: (progress: JobProgress) => void;
  onCompleted?: (progress: JobProgress) => void;
  onFailed?: (progress: JobProgress) => void;
  useWebSocket?: boolean;
}

interface UseImageGenerationResult {
  generateImage: (request: ImageGenerationRequest) => Promise<void>;
  currentJob: JobProgress | null;
  isGenerating: boolean;
  error: string | null;
  clearError: () => void;
  cancelJob: () => void;
}

export const useImageGeneration = (options: UseImageGenerationOptions = {}): UseImageGenerationResult => {
  const { onProgress, onCompleted, onFailed, useWebSocket = true } = options;
  const { getToken } = useAuth();
  const lastProgressRef = useRef<number>(Date.now());
  const [currentJob, setCurrentJob] = useState<JobProgress | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const currentJobIdRef = useRef<string | null>(null);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Persist job info for recovery after refresh
  const ACTIVE_JOB_KEY = 'snap2story_active_job';
  
  const persistActiveJob = (jobId: string, jobData?: any) => {
    if (typeof window !== 'undefined') {
      const jobInfo = {
        jobId,
        timestamp: Date.now(),
        data: jobData,
      };
      sessionStorage.setItem(ACTIVE_JOB_KEY, JSON.stringify(jobInfo));
    }
  };
  
  const clearPersistedJob = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(ACTIVE_JOB_KEY);
    }
  };
  
  const getPersistedJob = (): { jobId: string; timestamp: number; data?: any } | null => {
    if (typeof window === 'undefined') return null;
    
    const stored = sessionStorage.getItem(ACTIVE_JOB_KEY);
    if (!stored) return null;
    
    try {
      const jobInfo = JSON.parse(stored);
      // Check if job is less than 10 minutes old
      const age = Date.now() - jobInfo.timestamp;
      if (age > 10 * 60 * 1000) {
        clearPersistedJob();
        return null;
      }
      return jobInfo;
    } catch {
      return null;
    }
  };

  // WebSocket event handlers
  const handleProgress = useCallback((progress: JobProgress) => {
    if (progress.jobId === currentJobIdRef.current) {
      setCurrentJob(progress);
      lastProgressRef.current = Date.now();
      onProgress?.(progress);
    }
  }, [onProgress]);

  const handleCompleted = useCallback((progress: JobProgress) => {
    if (progress.jobId === currentJobIdRef.current) {
      setCurrentJob(progress);
      setIsGenerating(false);
      clearPersistedJob(); // Clear on completion
      onCompleted?.(progress);
      cleanupCurrentJob();
    }
  }, [onCompleted]);

  const handleFailed = useCallback((progress: JobProgress) => {
    if (progress.jobId === currentJobIdRef.current) {
      setCurrentJob(progress);
      setIsGenerating(false);
      setError(progress.error || 'Image generation failed');
      clearPersistedJob(); // Clear on failure
      onFailed?.(progress);
      cleanupCurrentJob();
    }
  }, [onFailed]);

  // Cleanup function for current job
  const cleanupCurrentJob = useCallback(() => {
    const jobIdToCleanup = currentJobIdRef.current;
    
    if (jobIdToCleanup && wsClient.isConnected()) {
      console.log(`🧹 Cleaning up WebSocket subscription for job: ${jobIdToCleanup}`);
      wsClient.unsubscribeFromJob(jobIdToCleanup);
    }
    // Do NOT remove global WS listeners here — they are managed by the effect cleanup on unmount
    currentJobIdRef.current = null;
  }, []);

  // Check for persisted job on mount and reconnect
  useEffect(() => {
    const checkPersistedJob = async () => {
      const persistedJob = getPersistedJob();
      if (!persistedJob || !useWebSocket) return;
      
      console.log('🔄 Found persisted job, attempting to reconnect:', persistedJob.jobId);
      
      try {
        // Check job status first
        const status = await queueClient.getJobStatus(persistedJob.jobId);
        
        if (status.status === 'completed' || status.status === 'failed') {
          // Job already finished, clear persistence
          clearPersistedJob();
          return;
        }
        
        // Job still active, reconnect
        currentJobIdRef.current = persistedJob.jobId;
        setCurrentJob(status);
        setIsGenerating(true);
        
        // Connect to WebSocket and subscribe
        if (!wsClient.isConnected()) {
          await wsClient.connect();
        }
        wsClient.subscribeToJob(persistedJob.jobId);
        
        console.log('✅ Successfully reconnected to job:', persistedJob.jobId);
      } catch (error) {
        console.error('Failed to reconnect to persisted job:', error);
        clearPersistedJob();
      }
    };
    
    checkPersistedJob();
  }, []); // Only run on mount

  // Setup WebSocket listeners
  useEffect(() => {
    if (!useWebSocket) return;

    const connectAndSetupListeners = async () => {
      try {
        await wsClient.connect();
        
        const progressCleanup = wsClient.onJobProgress(handleProgress);
        const completedCleanup = wsClient.onJobCompleted(handleCompleted);
        const failedCleanup = wsClient.onJobFailed(handleFailed);
        
        cleanupFunctionsRef.current.push(progressCleanup, completedCleanup, failedCleanup);
      } catch (error) {
        console.warn('WebSocket connection failed, will use polling fallback:', error);
      }
    };

    connectAndSetupListeners();

    return () => {
      // Only cleanup on unmount, not on every effect re-run
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, [useWebSocket, handleProgress, handleCompleted, handleFailed]);

  const generateImage = useCallback(async (request: ImageGenerationRequest) => {
    try {
      console.log('🚀 Starting image generation request:', request);
      setError(null);
      setIsGenerating(true);
      setCurrentJob(null);
      lastProgressRef.current = Date.now();

      // Clean up any existing job but don't clear the ref yet
      const previousJobId = currentJobIdRef.current;
      if (previousJobId && wsClient.isConnected()) {
        console.log(`🧹 Unsubscribing from previous job: ${previousJobId}`);
        wsClient.unsubscribeFromJob(previousJobId);
      }
      
      // Do not clear global WS listeners here; they persist across jobs

      console.log('📤 Sending request to queue client...');
      const token = await getToken();
      const response: JobResponse = await queueClient.generateImage(request, token || undefined);
      console.log('✅ Queue client response:', response);
      
      currentJobIdRef.current = response.jobId;
      
      // Persist the job for recovery
      persistActiveJob(response.jobId, request);
      
      setCurrentJob({
        jobId: response.jobId,
        status: 'queued',
        progress: 0,
        message: response.message,
      });

      // Subscribe to WebSocket updates if available
      if (useWebSocket) {
        console.log('🔌 WebSocket enabled, checking connection...');
        if (wsClient.isConnected()) {
          console.log('✅ WebSocket connected, subscribing to job:', response.jobId);
          wsClient.subscribeToJob(response.jobId);
        } else {
          console.log('⚠️ WebSocket not connected, attempting to connect...');
          try {
            await wsClient.connect();
            console.log('✅ WebSocket connected after retry, subscribing to job:', response.jobId);
            wsClient.subscribeToJob(response.jobId);
          } catch (wsError) {
            console.error('❌ WebSocket connection failed, using polling fallback:', wsError);
            startPollingFallback();
          }
        }
        // Watchdog: if no progress arrives shortly, switch to polling as backup
        const watchdogDelay = 12000; // 12s
        const checkNoProgress = () => {
          // If still generating and no progress events updated currentJob, start polling
          const cj = currentJobIdRef.current;
          const elapsed = Date.now() - lastProgressRef.current;
          if (cj === response.jobId && isGenerating && elapsed >= watchdogDelay) {
            console.warn('⏱️ No WS progress within watchdog window; switching to polling');
            startPollingFallback();
          }
        };
        setTimeout(checkNoProgress, watchdogDelay + 100);
      } else {
        console.log('📊 WebSocket disabled, using polling fallback');
        startPollingFallback();
      }

      async function startPollingFallback() {
        // Fallback to polling if WebSocket is not available
        console.log('📊 Using polling fallback for job:', response.jobId);
        
        try {
          const finalProgress = await queueClient.pollForCompletion(
            response.jobId,
            (progress) => {
              setCurrentJob(progress);
              onProgress?.(progress);
            }
          );
          
          setCurrentJob(finalProgress);
          setIsGenerating(false);
          onCompleted?.(finalProgress);
        } catch (pollError) {
          const errorMessage = pollError instanceof Error ? pollError.message : 'Polling failed';
          setError(errorMessage);
          setIsGenerating(false);
          
          const failedProgress: JobProgress = {
            jobId: response.jobId,
            status: 'failed',
            progress: 0,
            message: 'Job failed',
            error: errorMessage,
          };
          
          setCurrentJob(failedProgress);
          onFailed?.(failedProgress);
        } finally {
          cleanupCurrentJob();
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(errorMessage);
      setIsGenerating(false);
      cleanupCurrentJob();
    }
  }, [useWebSocket, onProgress, onCompleted, onFailed, cleanupCurrentJob]);

  const cancelJob = useCallback(() => {
    cleanupCurrentJob();
    clearPersistedJob(); // Clear on cancel
    setIsGenerating(false);
    setCurrentJob(null);
    setError(null);
  }, [cleanupCurrentJob]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generateImage,
    currentJob,
    isGenerating,
    error,
    clearError,
    cancelJob,
  };
};
