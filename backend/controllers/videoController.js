const pool = require('../db');

// GET /api/videos/tags
async function getAllTags(req, res) {
    try {
        const [tags] = await pool.query('SELECT * FROM tags ORDER BY name ASC');
        res.json(tags);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

// GET /api/videos
async function getVideos(req, res) {
    try {
        const { search, tag, tags } = req.query;

        // Support both single-tag (?tag=Comedy) and multi-tag (?tags=Comedy,2024)
        let selectedTags = [];
        if (typeof tags === 'string' && tags.length > 0) {
            selectedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
        } else if (tag) {
            selectedTags = [tag];
        }

        let query = `
      SELECT v.*, u.full_name as uploader_name, GROUP_CONCAT(t.name) as tags
      FROM videos v
      JOIN users u ON v.uploader_id = u.id
      LEFT JOIN video_tags vt ON v.id = vt.video_id
      LEFT JOIN tags t ON vt.tag_id = t.id
    `;

        const params = [];
        const whereConditions = [];

        const trimmedSearch = typeof search === 'string' ? search.trim() : '';
        if (trimmedSearch) {
            const searchPattern = `%${trimmedSearch.toLowerCase()}%`;
            // Case-insensitive search on title, description, and tag name
            whereConditions.push(
                '(LOWER(v.title) LIKE ? OR LOWER(v.description) LIKE ? OR LOWER(t.name) LIKE ?)'
            );
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (whereConditions.length > 0) {
            query += ` WHERE ` + whereConditions.join(' AND ');
        }

        query += ` GROUP BY v.id`;

        // Tag filtering using GROUP_CONCAT result.
        // If multiple tags are selected, require videos to contain *all* of them.
        if (selectedTags.length > 0) {
            const havingClauses = selectedTags.map(() => 'FIND_IN_SET(?, tags)');
            query += ` HAVING ` + havingClauses.join(' AND ');
            params.push(...selectedTags);
        }

        query += ` ORDER BY v.created_at DESC`;

        const [videos] = await pool.query(query, params);

        const processedVideos = videos.map((video) => ({
            ...video,
            tags: video.tags ? video.tags.split(',') : []
        }));

        res.json(processedVideos);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

// GET /api/videos/:id
async function getVideoById(req, res) {
    try {
        const [rows] = await pool.query(
            `
      SELECT v.*, u.full_name as uploader_name
      FROM videos v
      JOIN users u ON v.uploader_id = u.id
      WHERE v.id = ?
    `,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ msg: 'Video not found' });
        }

        const video = rows[0];

        const [tags] = await pool.query(
            `
      SELECT t.id, t.name 
      FROM tags t
      JOIN video_tags vt ON t.id = vt.tag_id
      WHERE vt.video_id = ?
    `,
            [req.params.id]
        );

        video.tags = tags;

        await pool.query('UPDATE videos SET views = views + 1 WHERE id = ?', [req.params.id]);

        res.json(video);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

module.exports = {
    getAllTags,
    getVideos,
    getVideoById
};

