const express = require('express');
const passport = require('passport');
const {
    register,
    login,
    logout,
    getCurrentUser,
    oauthSuccessRedirect
} = require('../controllers/authController');

const router = express.Router();

// Auth routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getCurrentUser);

// Google OAuth (force account selection each time)
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
}));
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    oauthSuccessRedirect
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get(
    '/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    oauthSuccessRedirect
);

module.exports = router;

