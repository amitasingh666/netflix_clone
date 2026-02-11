const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SAMPLE_VIDEOS = [
    {
        title: "Extreme Skateboarding 4K",
        description: "Experience the thrill of skateboarding in stunning 4K ultra high definition. Captured with the Phantom Flex camera.",
        video_url: "http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8",
        thumbnail_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg",
        duration: 320,
        tags: ["Sports", "Action"]
    },
    {
        title: "Morning Yoga Flow",
        description: "Start your day with energy and balance. A complete yoga session designed to improve flexibility and mindfulness.",
        video_url: "https://flipfit-cdn.akamaized.net/flip_hls/662aae7a42cd740019b91dec-3e114f/video_h1.m3u8",
        thumbnail_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg",
        duration: 900,
        tags: ["Health", "Lifestyle"]
    },
    {
        title: "Big Buck Bunny",
        description: "A large and lovable rabbit deals with three tiny bullies, led by a flying squirrel, who are determined to squelch his happiness.",
        video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        thumbnail_url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
        duration: 596,
        tags: ["Animation", "Comedy"]
    },
    {
        title: "High Intensity Cardio",
        description: "Push your limits with this high-intensity interval training session. Burn calories and build endurance.",
        video_url: "https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8",
        thumbnail_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg",
        duration: 1200,
        tags: ["Fitness", "Sports"]
    },
    {
        title: "Elephants Dream",
        description: "The world's first open movie, made entirely with open source graphics software such as Blender, and with all production files freely available to use however you please.",
        video_url: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8", // Using same stream for demo
        thumbnail_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg",
        duration: 653,
        tags: ["Sci-Fi", "Animation"]
    }
];

async function seedData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'video_streaming_service'
    });

    try {
        console.log('Clearing existing data...');
        await connection.query('DELETE FROM video_tags');
        await connection.query('DELETE FROM videos');
        await connection.query('DELETE FROM tags');
        await connection.query('DELETE FROM users');

        // Reset Auto Increment
        await connection.query('ALTER TABLE users AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE videos AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE tags AUTO_INCREMENT = 1');

        console.log('Creating Test User...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('password123', salt);
        const [userResult] = await connection.query(
            'INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)',
            ['Test User', 'test@example.com', hash]
        );
        const userId = userResult.insertId;

        console.log('Seeding Tags...');
        const uniqueTags = new Set();
        SAMPLE_VIDEOS.forEach(v => v.tags.forEach(t => uniqueTags.add(t)));

        for (const tagName of uniqueTags) {
            // Need to check if tag exists first or handle nicely
            await connection.query('INSERT INTO tags (name) VALUES (?)', [tagName]);
            // InsertId might be wrong if tag already exists and we ignore? But wait, we cleared tags.
            // So this is fine because we cleared tables.
        }

        // Need to fetch IDs back map
        const [allTags] = await connection.query('SELECT * FROM tags');
        const tagMap = new Map(); // Renamed dbTagMap to tagMap to match later usage
        allTags.forEach(t => tagMap.set(t.name, t.id));

        console.log('Seeding Videos...');
        for (const video of SAMPLE_VIDEOS) {
            const [res] = await connection.query(
                'INSERT INTO videos (uploader_id, title, description, video_url, thumbnail_url, duration, processing_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [userId, video.title, video.description, video.video_url, video.thumbnail_url, video.duration, 'completed']
            );
            const videoId = res.insertId;

            for (const tagName of video.tags) {
                const tagId = tagMap.get(tagName);
                if (tagId) {
                    await connection.query('INSERT INTO video_tags (video_id, tag_id) VALUES (?, ?)', [videoId, tagId]);
                }
            }
        }

        console.log('Database seeded successfully!');
        console.log('Test User: test@example.com / password123');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await connection.end();
    }
}

seedData();
