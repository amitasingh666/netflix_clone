const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const {
    getAllTags,
    getVideos,
    getVideoById
} = require('../controllers/videoController');

const router = express.Router();

// Tags
router.get('/tags', getAllTags);

// Video listing & search
router.get('/', getVideos);

// Single video (protected)
router.get('/:id', ensureAuthenticated, getVideoById);

module.exports = router;

