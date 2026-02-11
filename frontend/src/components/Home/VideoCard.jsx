import React from 'react';

const VideoCard = ({ video, onClick }) => {
    return (
        <div
            className="video-card"
            onClick={() => onClick(video.id)}
        >
            <img
                src={video.thumbnail_url}
                alt={video.title}
                className="video-card__thumbnail"
                loading="lazy"
            />
            <div className="video-card__info">
                <h4 className="video-card__info-title">{video.title}</h4>
                <div className="video-card__info-tags">
                    {video.tags.join(' • ')}
                </div>
            </div>
        </div>
    );
};

export default React.memo(VideoCard);
