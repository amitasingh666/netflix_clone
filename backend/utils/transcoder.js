// utils/transcodeToHLS.js
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const transcodeToHLS = async (inputPath, outputDir, videoId) => {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`Starting transcoding for Video ${videoId}...`);

    const qualities = [
        { name: '1080p', size: '1920x1080', videoBitrate: '5000k', audioBitrate: '192k', bandwidth: 5300000 },
        { name: '720p', size: '1280x720', videoBitrate: '2500k', audioBitrate: '128k', bandwidth: 2800000 },
        { name: '480p', size: '854x480', videoBitrate: '1000k', audioBitrate: '128k', bandwidth: 1400000 },
        { name: '360p', size: '640x360', videoBitrate: '800k', audioBitrate: '96k', bandwidth: 1000000 },
        { name: '144p', size: '256x144', videoBitrate: '400k', audioBitrate: '64k', bandwidth: 600000 }
    ];

    try {
        // Transcode each quality separately
        for (const quality of qualities) {
            await new Promise((resolve, reject) => {
                console.log(`Transcoding ${quality.name}...`);
                
                ffmpeg(inputPath, { timeout: 432000 })
                    .videoCodec('libx264')
                    .audioCodec('aac')
                    .size(quality.size)
                    .videoBitrate(quality.videoBitrate)
                    .audioBitrate(quality.audioBitrate)
                    .addOptions([
                        '-profile:v main',
                        '-level 4.0',
                        '-start_number 0',
                        '-hls_time 10',
                        '-hls_list_size 0',
                        '-hls_segment_filename', path.join(outputDir, `${quality.name}_%03d.ts`),
                        '-f hls'
                    ])
                    .output(path.join(outputDir, `${quality.name}.m3u8`))
                    .on('end', () => {
                        console.log(`${quality.name} completed`);
                        resolve();
                    })
                    .on('error', (err) => {
                        console.error(`Error transcoding ${quality.name}:`, err);
                        reject(err);
                    })
                    .on('progress', (progress) => {
                        console.log(`${quality.name}: ${progress.percent}% done`);
                    })
                    .run();
            });
        }

        // Create master playlist
        const masterPlaylist = qualities.map(q => 
            `#EXT-X-STREAM-INF:BANDWIDTH=${q.bandwidth},RESOLUTION=${q.size}\n${q.name}.m3u8`
        ).join('\n');

        const fullMasterPlaylist = `#EXTM3U\n#EXT-X-VERSION:3\n${masterPlaylist}`;

        fs.writeFileSync(path.join(outputDir, 'master.m3u8'), fullMasterPlaylist);
        console.log(`Transcoding completed for Video ${videoId}`);
        
        return { success: true, qualities: qualities.map(q => q.name) };
    } catch (error) {
        console.error(`Transcoding failed for Video ${videoId}:`, error);
        throw error;
    }
};

module.exports = transcodeToHLS;