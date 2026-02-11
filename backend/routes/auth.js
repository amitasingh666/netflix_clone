const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const pool = require('../db');
const router = express.Router();

// Register Handle
router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;
    let errors = [];

    // 1. Check Required Fields
    if (!full_name || !email || !password) {
        errors.push({ msg: 'Please enter all fields' });
    }

    // 2. NEW: Check Email Format (Regex Validation)
    // This regex checks for: chars + @ + chars + . + chars
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push({ msg: 'Please enter a valid email address' });
    }

    // 3. Check Password Length
    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        // Check if user exists
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'Email already exists' }] });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            [full_name, email, hash]
        );

        const newUser = {
            id: result.insertId,
            full_name,
            email
        };

        // Auto login
        req.login(newUser, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Registered but failed to login' });
            }
            return res.status(201).json({ msg: 'User registered and logged in', user: newUser });
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ msg: info.message });

        req.logIn(user, (err) => {
            if (err) return next(err);
            const { password_hash, ...userData } = user;
            return res.json({ msg: 'Logged in successfully', user: userData });
        });
    })(req, res, next);
});

// Logout Handle
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ msg: 'Logged out successfully' });
    });
});

// Get Current User
router.get('/me', (req, res) => {
    try {
        if (req.isAuthenticated()) {
            if (!req.user) {
                // This shouldn't happen if isAuthenticated is true, but just in case
                console.error('req.user is missing despite isAuthenticated=true');
                return res.json({ isAuthenticated: false, user: null });
            }
            const { password_hash, ...user } = req.user;
            res.json({ isAuthenticated: true, user });
        } else {
            res.json({ isAuthenticated: false, user: null });
        }
    } catch (err) {
        console.error('Error in /auth/me:', err);
        res.status(500).json({ msg: 'Server Error in /me' });
    }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('http://localhost:5173/'); // Redirect to frontend
    }
);

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

router.get('/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    (req, res) => {
        res.redirect('http://localhost:5173/');
    }
);

module.exports = router;
