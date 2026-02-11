import React from 'react';
import { Play, Info } from 'lucide-react';

const HeroBanner = ({ video, onPlay, onMoreInfo }) => {
    if (!video) return null;

    return (
        <div
            className="hero"
            style={{ backgroundImage: `url(${video.thumbnail_url})` }}
        >
            <div className="hero__overlay" />

            <div className="hero__content">
                <h1 className="hero__title">{video.title}</h1>
                <p className="hero__description">{video.description}</p>

                <div className="hero__actions">
                    <button
                        className="btn-primary hero__play-btn"
                        onClick={() => onPlay(video.id)}
                    >
                        <Play fill="white" size={24} /> Play
                    </button>

                    <button
                        className="hero__info-btn"
                        onClick={() => onMoreInfo(video.id)}
                    >
                        <Info size={24} /> More Info
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;
