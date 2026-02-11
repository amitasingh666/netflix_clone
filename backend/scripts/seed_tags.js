const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function seedTags() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'video_streaming_service'
    });

    try {
        const tags = ['Comedy', 'Sci-Fi', 'Action', 'Drama', 'Documentary'];

        for (const tag of tags) {
            // Simple ignore duplications
            await connection.query('INSERT IGNORE INTO tags (name) VALUES (?)', [tag]);
        }
        console.log('Tags seeded!');
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

seedTags();
