const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { streamVideo } = require('../controllers/streamController');

const router = express.Router();

// Route to serve the master playlist or segments
// URL Pattern: /api/stream/:videoId/:filename
router.get('/:videoId/:filename', ensureAuthenticated, streamVideo);

module.exports = router;

