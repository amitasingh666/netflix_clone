const passport = require('passport');
const bcrypt = require('bcryptjs');
const pool = require('../db');

// POST /api/auth/register
async function register(req, res) {
    const { full_name, email, password } = req.body;
    const errors = [];

    if (!full_name || !email || !password) {
        errors.push({ msg: 'Please enter all fields' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        errors.push({ msg: 'Please enter a valid email address' });
    }

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!strongPasswordRegex.test(password)) {
        errors.push({ msg: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*)' });
    }

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length > 0) {
            return res.status(400).json({ errors: [{ msg: 'Email already exists' }] });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            [full_name, email, hash]
        );

        const newUser = {
            id: result.insertId,
            full_name,
            email
        };

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
}

// POST /api/auth/login
function login(req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(400).json({ msg: info.message });

        req.logIn(user, (loginErr) => {
            if (loginErr) return next(loginErr);
            const { password_hash, ...userData } = user;
            return res.json({ msg: 'Logged in successfully', user: userData });
        });
    })(req, res, next);
}

// POST /api/auth/logout
function logout(req, res, next) {
    req.logout((err) => {
        if (err) { return next(err); }
        res.json({ msg: 'Logged out successfully' });
    });
}

// GET /api/auth/me
function getCurrentUser(req, res) {
    try {
        if (req.isAuthenticated()) {
            if (!req.user) {
                console.error('req.user is missing despite isAuthenticated=true');
                return res.json({ isAuthenticated: false, user: null });
            }
            const { password_hash, ...user } = req.user;
            return res.json({ isAuthenticated: true, user });
        }
        return res.json({ isAuthenticated: false, user: null });
    } catch (err) {
        console.error('Error in /auth/me:', err);
        res.status(500).json({ msg: 'Server Error in /me' });
    }
}

// OAuth success handlers
function oauthSuccessRedirect(req, res) {
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173/');
}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser,
    oauthSuccessRedirect
};

