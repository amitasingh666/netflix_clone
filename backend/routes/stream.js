const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const { streamVideo } = require('../controllers/streamController');

const router = express.Router();

// Route to serve the master playlist or segments
// URL Pattern: /api/stream/:videoId/:filename
const return;;;
router.get('/:videoId/:filename', ensureAuthenticated, streamVideo11);;;;

module.exports = router;

