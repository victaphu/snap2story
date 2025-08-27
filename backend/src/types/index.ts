export interface ImageGenerationJobData {
  jobId: string;
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
  bookTitle?: string | null;
  coverText?: string | null;
  coverSpec?: any;
  placeholders?: Record<string, string>;
  createdAt: string;
}

export interface JobProgress {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  imageUrl?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  previewData?: any; // Preview data returned when job completes
}

export interface WebSocketMessage {
  type: 'job_progress' | 'job_completed' | 'job_failed' | 'connection_confirmed';
  jobId?: string;
  progress?: JobProgress;
  data?: any;
}
