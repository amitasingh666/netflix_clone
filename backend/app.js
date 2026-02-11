const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const passport = require('passport');
const dotenv = require('dotenv');
const path = require('path');
const pool = require('./db');

// Load environment variables from backend .env
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// CORS configuration (frontend origin)
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session store backed by MySQL
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'video_streaming_service',
    createDatabaseTable: true
});

app.use(session({
    key: process.env.SESSION_COOKIE_NAME || 'session_cookie_name',
    secret: process.env.SESSION_SECRET || 'secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
    }
}));

// Passport initialization & configuration
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Health check / root
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Route mounting
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/stream', require('./routes/stream'));
app.use('/api/upload', require('./routes/upload'));

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({ msg: 'Internal Server Error', error: err.message });
});

module.exports = app;

