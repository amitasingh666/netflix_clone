const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Ensure we load the .env file from the backend root
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
    database: process.env.DB_NAME || 'video_streaming_service',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection immediately on startup
pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('❌ Database connection was closed.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('❌ Database has too many connections.');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('❌ Database connection was refused. Is MySQL running?');
        }
        if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('❌ Access denied. Check your DB_USER and DB_PASSWORD in .env');
        }
    } else {
        console.log('✅ Connected to MySQL Database');
        if (connection) connection.release();
    }
});

module.exports = pool.promise();