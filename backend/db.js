const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Ensure we load the .env file from the backend root
dotenv.config({ path: path.join(__dirname, '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: 19550, // Aiven port
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false
    }
});

// Test the connection immediately on startup
pool.getConnection((err, connection) => {
    if (err) {
        console.error("❌ DB Connection Error:", err.code);
    } else {
        console.log("✅ Connected to Aiven MySQL");
        connection.release();
    }
});

module.exports = pool.promise();