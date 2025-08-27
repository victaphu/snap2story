# Snap2Story Backend

Backend service for handling long-running image generation tasks with queue system and WebSocket progress updates.

## Features

- **Queue System**: Uses Redis and BullMQ for reliable job processing
- **WebSocket Updates**: Real-time progress updates to frontend clients
- **Scalable Workers**: Separate worker processes for image generation
- **Error Handling**: Automatic retries and graceful failure handling
- **Health Monitoring**: Built-in health checks and queue statistics

## Architecture

```
Frontend → API Server → Redis Queue → Worker Processes
    ↑                                       ↓
    └──── WebSocket ←── Progress Updates ────┘
```

## Quick Start

### Development

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Up Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start Redis** (using Docker)
   ```bash
   docker run -d --name redis -p 6379:6379 redis:alpine
   ```

4. **Start Development Servers**
   ```bash
   # Terminal 1: API Server
   npm run dev

   # Terminal 2: Worker Process
   npm run worker
   ```

### Production (Render)

1. **Deploy to Render**
   ```bash
   # Push to your Git repository
   git add .
   git commit -m "Add backend service"
   git push

   # Render will automatically deploy using render.yaml
   ```

2. **Configure Environment Variables**
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `QWEN_3_IMAGE_EDIT_KEY`: Your Qwen API key
   - `CORS_ORIGINS`: Your frontend domain (e.g., https://yourapp.com)

## Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Redis Configuration (auto-configured on Render)
REDIS_URL=redis://localhost:6379

# AI Service Keys
OPENAI_API_KEY=your_openai_api_key
QWEN_3_IMAGE_EDIT_KEY=your_qwen_key

# CORS Origins (comma-separated)
CORS_ORIGINS=https://yourfrontend.com,http://localhost:3000

# Worker Configuration
WORKER_CONCURRENCY=2

# WebSocket Configuration
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000
```

## API Endpoints

### POST `/api/jobs/generate-image`
Create a new image generation job.

**Request Body:**
```json
{
  "heroName": "John",
  "themeId": "adventure",
  "originalImageBase64": "data:image/jpeg;base64,...",
  "styleKey": "watercolor",
  "kind": "cover"
}
```

**Response:**
```json
{
  "jobId": "abc123",
  "status": "queued",
  "message": "Job queued successfully",
  "statusUrl": "/api/jobs/abc123/status",
  "websocketSubscription": "job:abc123"
}
```

### GET `/api/jobs/:jobId/status`
Get current job status and progress.

**Response:**
```json
{
  "jobId": "abc123",
  "status": "processing",
  "progress": 75,
  "message": "Generating image with AI...",
  "startedAt": "2024-01-01T12:00:00Z"
}
```

### GET `/api/jobs/stats`
Get queue statistics.

**Response:**
```json
{
  "waiting": 3,
  "active": 2,
  "completed": 156,
  "failed": 4
}
```

### GET `/api/jobs/health`
Health check endpoint.

## WebSocket Events

### Client → Server
- `subscribe_to_job`: Subscribe to job updates
- `unsubscribe_from_job`: Unsubscribe from job updates
- `ping`: Connection health check

### Server → Client
- `job_progress`: Progress update
- `job_completed`: Job completed successfully
- `job_failed`: Job failed with error
- `connection_confirmed`: Connection established

## Frontend Integration

### Environment Variables (Next.js)
```bash
# Add to your .env.local
NEXT_PUBLIC_BACKEND_URL=https://your-backend.render.com
USE_QUEUE_SYSTEM=true
```

### Usage Example
```typescript
import { useImageGeneration } from '@/lib/hooks/useImageGeneration';

const MyComponent = () => {
  const { generateImage, currentJob, isGenerating, error } = useImageGeneration({
    onProgress: (progress) => console.log(`Progress: ${progress.progress}%`),
    onCompleted: (result) => console.log('Image ready:', result.imageUrl),
    onFailed: (error) => console.error('Generation failed:', error.error)
  });

  const handleGenerate = async () => {
    await generateImage({
      heroName: 'John',
      originalImageBase64: 'data:image/jpeg;base64,...',
      kind: 'cover'
    });
  };

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? `Generating... ${currentJob?.progress || 0}%` : 'Generate Image'}
      </button>
      {currentJob && (
        <div>Status: {currentJob.message}</div>
      )}
      {error && (
        <div>Error: {error}</div>
      )}
    </div>
  );
};
```

## Deployment on Render

The `render.yaml` file configures three services:

1. **Web Service** (`snap2story-backend-api`): API server with WebSocket support
2. **Worker Service** (`snap2story-image-worker`): Background job processor
3. **Redis Service** (`snap2story-redis`): Queue storage

Services will auto-scale based on load and automatically restart on failure.

## Monitoring

- Health checks: `/api/jobs/health`
- Queue stats: `/api/jobs/stats`
- Logs: Available in Render dashboard
- Redis monitoring: Built-in Render Redis metrics

## Troubleshooting

### Common Issues

1. **Jobs stuck in queue**: Check worker process is running
2. **WebSocket connection failed**: Verify CORS_ORIGINS includes your domain
3. **Image generation timeout**: Check AI service API keys and quotas
4. **Redis connection errors**: Verify REDIS_URL is correct

### Debugging

```bash
# Check queue status
curl https://your-backend.render.com/api/jobs/stats

# Check health
curl https://your-backend.render.com/api/jobs/health

# View logs in Render dashboard
```

## Scaling

- **Horizontal**: Add more worker instances in Render
- **Vertical**: Upgrade to higher-tier Render plans
- **Queue**: Redis plan can be upgraded for more memory
- **Concurrency**: Adjust `WORKER_CONCURRENCY` environment variable