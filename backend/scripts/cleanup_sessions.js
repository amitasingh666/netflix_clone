const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function clearSessions() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'video_streaming_service'
    });

    try {
        console.log('Clearing sessions table...');
        await connection.query('DELETE FROM sessions');
        console.log('Sessions cleared!');
    } catch (err) {
        // If table doesn't exist, that's fine too
        console.error('Error clearing sessions (might not exist):', err.message);
    } finally {
        await connection.end();
    }
}

clearSessions();
