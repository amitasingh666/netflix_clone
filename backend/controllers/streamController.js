const fs = require('fs');
const path = require('path');
const pool = require('../db');

// GET /api/stream/:videoId/:filename
async function streamVideo(req, res) {
    const { videoId, filename } = req.params;

    try {
        const [rows] = await pool.query('SELECT video_url FROM videos WHERE id = ?', [videoId]);
        if (rows.length === 0) return res.status(404).send('Video not found');

        const videoUrl = rows[0].video_url;

        // External URL handling for seeded data
        if (videoUrl.startsWith('http')) {
            if (filename === 'master.m3u8') {
                return res.redirect(videoUrl);
            }
        }

        // Local file handling
        const videoDir = path.join(__dirname, '..', 'uploads', 'videos', videoId);
        const filePath = path.join(videoDir, filename);

        // Prevent directory traversal
        if (!filePath.startsWith(videoDir)) {
            return res.status(403).send('Forbidden');
        }

        if (fs.existsSync(filePath)) {
            const ext = path.extname(filename);
            if (ext === '.m3u8') {
                res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            } else if (ext === '.ts') {
                res.setHeader('Content-Type', 'video/MP2T');
            }
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
        } else {
            if (videoUrl.startsWith('http') && filename === 'master.m3u8') {
                return res.redirect(videoUrl);
            }
            return res.status(404).send('File not found');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

module.exports = {
    streamVideo
};

