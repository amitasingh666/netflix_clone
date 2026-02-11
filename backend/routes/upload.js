const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db');
const { ensureAuthenticated } = require('../middleware/auth');
const transcodeToHLS = require('../utils/transcoder');

// Configure multer for video uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'temp');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /mp4|mov|avi|mkv|webm/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'));
        }
    }
});

// Upload video endpoint
router.post('/upload', ensureAuthenticated, upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }

        const { title, description, tags } = req.body;
        const uploaderId = req.user.id;

        // 1. Create video record in database with 'processing' status
        const [result] = await pool.query(
            `INSERT INTO videos (uploader_id, title, description, processing_status, video_url) 
             VALUES (?, ?, ?, 'processing', '')`,
            [uploaderId, title, description || '']
        );

        const videoId = result.insertId;

        // 2. Add tags if provided
        if (tags && Array.isArray(tags)) {
            for (const tagName of tags) {
                // Get or create tag
                const [tagResult] = await pool.query(
                    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
                    [tagName]
                );
                const tagId = tagResult.insertId;

                // Link video to tag
                await pool.query(
                    'INSERT INTO video_tags (video_id, tag_id) VALUES (?, ?)',
                    [videoId, tagId]
                );
            }
        }

        // 3. Start transcoding in background
        const inputPath = req.file.path;
        const outputDir = path.join(__dirname, '..', 'uploads', 'videos', videoId.toString());

        // Send immediate response
        res.json({
            message: 'Video uploaded successfully. Transcoding in progress...',
            videoId: videoId,
            status: 'processing'
        });

        // 4. Transcode asynchronously
        (async () => {
            try {
                console.log(`Starting transcoding for video ${videoId}...`);

                await transcodeToHLS(inputPath, outputDir, videoId);

                // Update database with completed status and video URL
                const videoUrl = `/api/stream/${videoId}/master.m3u8`;
                await pool.query(
                    `UPDATE videos SET processing_status = 'completed', video_url = ? WHERE id = ?`,
                    [videoUrl, videoId]
                );

                // Delete temporary upload file
                fs.unlinkSync(inputPath);

                console.log(`✅ Video ${videoId} transcoded successfully!`);
            } catch (error) {
                console.error(`❌ Transcoding failed for video ${videoId}:`, error);

                // Update status to failed
                await pool.query(
                    `UPDATE videos SET processing_status = 'failed' WHERE id = ?`,
                    [videoId]
                );
            }
        })();

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
});

// Get video processing status
router.get('/status/:videoId', ensureAuthenticated, async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT id, title, processing_status, video_url FROM videos WHERE id = ?',
            [req.params.videoId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Status check error:', error);
        res.status(500).json({ error: 'Failed to check status' });
    }
});

module.exports = router;
