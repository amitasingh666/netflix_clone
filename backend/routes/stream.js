const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { ensureAuthenticated } = require('../middleware/auth');
const pool = require('../db');

// Route to serve the master playlist or segments
// URL Pattern: /api/stream/:videoId/:filename
// Example: /api/stream/1/master.m3u8
// Example: /api/stream/1/720p.m3u8
// Example: /api/stream/1/segment0.ts
router.get('/:videoId/:filename', ensureAuthenticated, async (req, res) => {
    const { videoId, filename } = req.params;

    try {
        // 1. Check if video exists and get its URL from DB
        const [rows] = await pool.query('SELECT video_url FROM videos WHERE id = ?', [videoId]);
        if (rows.length === 0) return res.status(404).send('Video not found');

        const videoUrl = rows[0].video_url;

        // 2. EXTERNAL URL HANDLING (For Seeded Data)
        // If the DB URL is an external link (starts with http), we redirect or proxy.
        // For MVP simplicity: If the DB entry says it's external, and we requested 'master.m3u8',
        // we redirect the player to that external stream.
        if (videoUrl.startsWith('http')) {
            // Note: Video.js might struggle if we return a 302 redirect for a manifest request 
            // depending on CORS. But let's try redirecting the master playlist request.
            if (filename === 'master.m3u8') {
                return res.redirect(videoUrl);
            }
            // If it's asking for segments from our server but the source is external, this approach fails
            // unless we reverse proxy.
            // BETTER MVP APPROACH:
            // Since we don't have local files for "Big Buck Bunny", we should arguably
            // treat the 'video_url' in the DB as the source of truth.
        }

        // 3. LOCAL FILE HANDLING
        const videoDir = path.join(__dirname, '..', 'uploads', 'videos', videoId);
        const filePath = path.join(videoDir, filename);

        // Prevent traversal
        if (filePath.indexOf(videoDir) !== 0) {
            return res.status(403).send('Forbidden');
        }

        if (fs.existsSync(filePath)) {
            // Set Content-Type
            const ext = path.extname(filename);
            if (ext === '.m3u8') {
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            } else if (ext === '.ts') {
                res.setHeader('Content-Type', 'video/MP2T');
            }
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } else {
            // Fallback: If local file missing, maybe it's the external one?
            // If we are here, it means we requested /api/stream/1/master.m3u8
            // but it doesn't exist locally.
            if (videoUrl.startsWith('http') && filename === 'master.m3u8') {
                return res.redirect(videoUrl);
            }
            return res.status(404).send('File not found');
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
