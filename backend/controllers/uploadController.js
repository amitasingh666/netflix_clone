const path = require('path');
const fs = require('fs');
const pool = require('../db');
const transcodeToHLS = require('../utils/transcoder');

// POST /api/upload/upload
async function handleUpload(req, res) {
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
                const [tagResult] = await pool.query(
                    'INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
                    [tagName]
                );
                const tagId = tagResult.insertId;

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

        // 4. Transcode asynchronously (fire-and-forget)
        (async () => {
            try {
                console.log(`Starting transcoding for video ${videoId}...`);

                await transcodeToHLS(inputPath, outputDir, videoId);

                const videoUrl = `/api/stream/${videoId}/master.m3u8`;
                await pool.query(
                    `UPDATE videos SET processing_status = 'completed', video_url = ? WHERE id = ?`,
                    [videoUrl, videoId]
                );

                fs.unlinkSync(inputPath);

                console.log(`✅ Video ${videoId} transcoded successfully!`);
            } catch (error) {
                console.error(`❌ Transcoding failed for video ${videoId}:`, error);
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
}

// GET /api/upload/status/:videoId
async function getUploadStatus(req, res) {
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
}

module.exports = {
    handleUpload,
    getUploadStatus
};

