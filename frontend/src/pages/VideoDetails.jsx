import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideoById } from '../features/videos/videoSlice'; 
// NOTE: Do NOT import clearCurrentVideo here.

import { Play, ArrowLeft, Clock, Calendar } from 'lucide-react';

const VideoDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const { currentVideo, isLoading, error } = useSelector((state) => state.videos);
    const { isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchVideoById(id));
        
        // IMPORTANT: No cleanup function here. 
        // We leave the data in Redux so the Watch page can use it instantly.
    }, [dispatch, id]);

    const handlePlay = () => {
        if (isAuthenticated) {
            navigate(`/watch/${id}`);
        } else {
            navigate('/login');
        }
    };

    if (isLoading) {
        return <div style={{ color: 'white', display: 'flex', justifyContent: 'center', marginTop: '100px' }}>Loading details...</div>;
    }

    if (error || !currentVideo) {
        return (
            <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>
                <h2>Video not found</h2>
                <button className="btn-primary" onClick={() => navigate('/')}>Back to Home</button>
            </div>
        );
    }

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', color: 'white', background: '#141414' }}>
            {/* Background Image */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '70vh',
                backgroundImage: `url(${currentVideo.thumbnail_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.6
            }}>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to top, #141414 10%, transparent 90%)'
                }}></div>
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'linear-gradient(to right, #141414 10%, transparent 70%)'
                }}></div>
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 10, padding: '0 5%', paddingTop: '15vh', maxWidth: '800px' }}>
                <button 
                    onClick={() => navigate('/')}
                    style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', fontSize: '1.1rem' }}
                >
                    <ArrowLeft /> Back to Browse
                </button>

                <h1 style={{ fontSize: '4rem', margin: '0 0 20px 0', fontWeight: '800', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
                    {currentVideo.title}
                </h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', color: '#a3a3a3', fontSize: '1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={18} /> {formatDuration(currentVideo.duration)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={18} /> 2024
                    </div>
                    <div style={{ border: '1px solid #a3a3a3', padding: '2px 6px', fontSize: '0.8rem', borderRadius: '2px' }}>HD</div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '40px' }}>
                    <button 
                        onClick={handlePlay}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', padding: '12px 40px', borderRadius: '4px' }}
                    >
                        <Play fill="white" size={28} /> Play
                    </button>
                </div>

                <p style={{ fontSize: '1.2rem', lineHeight: '1.6', marginBottom: '40px', color: '#fff', maxWidth: '600px' }}>
                    {currentVideo.description}
                </p>

                <div>
                    <span style={{ color: '#777', marginRight: '10px' }}>Genres:</span>
                    {currentVideo.tags && currentVideo.tags.map((tag, index) => (
                        <span key={index} style={{ color: '#dcdcdc', marginRight: '10px' }}>
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