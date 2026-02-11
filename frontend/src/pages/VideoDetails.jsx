import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideoById } from '../redux/slices/videoSlice';
import useVideoNavigation from '../hooks/useVideoNavigation';
import { Play, ArrowLeft, Clock, Calendar } from 'lucide-react';

// Styles
import '../styles/VideoDetails.css';

const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
};

const VideoDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentVideo, isLoading, error } = useSelector((state) => state.videos);
    const { handlePlay } = useVideoNavigation();

    useEffect(() => {
        dispatch(fetchVideoById(id));
        // IMPORTANT: No cleanup function here.
        // We leave the data in Redux so the Watch page can use it instantly.
    }, [dispatch, id]);

    if (isLoading) {
        return <div className="video-details__loading">Loading details...</div>;
    }

    if (error || !currentVideo) {
        return (
            <div className="video-details__error">
                <h2>Video not found</h2>
                <button className="btn-primary" onClick={() => navigate('/')}>
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="video-details">
            {/* Background Image */}
            <div
                className="video-details__bg"
                style={{ backgroundImage: `url(${currentVideo.thumbnail_url})` }}
            >
                <div className="video-details__bg-gradient-top" />
                <div className="video-details__bg-gradient-side" />
            </div>

            {/* Content */}
            <div className="video-details__content">
                <button
                    onClick={() => navigate('/')}
                    className="video-details__back-btn"
                >
                    <ArrowLeft /> Back to Browse
                </button>

                <h1 className="video-details__title">{currentVideo.title}</h1>

                <div className="video-details__meta">
                    <div className="video-details__meta-item">
                        <Clock size={18} /> {formatDuration(currentVideo.duration)}
                    </div>
                    <div className="video-details__meta-item">
                        <Calendar size={18} /> 2024
                    </div>
                    <div className="video-details__badge">HD</div>
                </div>

                <div className="video-details__play-section">
                    <button
                        onClick={() => handlePlay(id)}
                        className="btn-primary video-details__play-btn"
                    >
                        <Play fill="white" size={28} /> Play
                    </button>
                </div>

                <p className="video-details__description">
                    {currentVideo.description}
                </p>

                <div className="video-details__genres">
                    <span className="video-details__genres-label">Genres:</span>
                    {currentVideo.tags &&
                        currentVideo.tags.map((tag, index) => (
                            <span key={index} className="video-details__genre-tag">
                                {typeof tag === 'object' ? tag.name : tag}
                                {index < currentVideo.tags.length - 1 && ','}
                            </span>
                        ))}
                </div>
            </div>
        </div>
    );
};

export default VideoDetails;