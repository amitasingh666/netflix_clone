import React from 'react';
import VideoCard from './VideoCard';

const VideoGrid = ({ videos, isLoading, onVideoClick }) => {
    return (
        <>
            <h2 className="video-grid__title">Trending Now</h2>
            {isLoading ? (
                <p className="video-grid__loading">Loading content...</p>
            ) : videos.length === 0 ? (
                <p className="video-grid__empty">
                    No videos available for the selected tags/search.
                </p>
            ) : (
                <div className="video-grid">
                    {videos.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onClick={onVideoClick}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default VideoGrid;
