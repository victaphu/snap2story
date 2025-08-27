"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nanoid_1 = require("../utils/nanoid");
const queue_1 = require("../services/queue");
const router = (0, express_1.Router)();
// Create a new image generation job
router.post('/generate-image', async (req, res) => {
    try {
        const { heroName, themeId, storyId, seriesKey, originalImageBase64, maskBase64, coverPromptOverride, ageGroup, length, styleKey, kind = 'cover', storyText, userId } = req.body;
        // Validate required fields
        if (!heroName || !originalImageBase64) {
            return res.status(400).json({
                error: 'Missing required fields: heroName and originalImageBase64 are required'
            });
        }
        const jobId = (0, nanoid_1.createNanoId)();
        const jobData = {
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
            createdAt: new Date().toISOString()
        };
        // Add job to queue
        await (0, queue_1.addImageGenerationJob)(jobData);
        res.status(202).json({
            jobId,
            status: 'queued',
            message: 'Image generation job queued successfully',
            statusUrl: `/api/jobs/${jobId}/status`,
            websocketSubscription: `job:${jobId}`
        });
    }
    catch (error) {
        console.error('Error creating image generation job:', error);
        res.status(500).json({
            error: 'Failed to create image generation job',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get job status and progress
router.get('/:jobId/status', async (req, res) => {
    try {
        const { jobId } = req.params;
        const progress = await (0, queue_1.getJobProgress)(jobId);
        if (!progress) {
            return res.status(404).json({
                error: 'Job not found'
            });
        }
        res.json(progress);
    }
    catch (error) {
        console.error('Error getting job status:', error);
        res.status(500).json({
            error: 'Failed to get job status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Get queue statistics
router.get('/stats', async (req, res) => {
    try {
        const stats = await (0, queue_1.getQueueStats)();
        res.json(stats);
    }
    catch (error) {
        console.error('Error getting queue stats:', error);
        res.status(500).json({
            error: 'Failed to get queue statistics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Health check endpoint
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'snap2story-backend'
    });
});
exports.default = router;
//# sourceMappingURL=jobs.js.map