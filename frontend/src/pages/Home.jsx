import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos, fetchTags } from '../features/videos/videoSlice';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Search, Play, Info } from 'lucide-react'; // Added Info icon
import { logout } from '../features/auth/authSlice';

const Home = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { videos, tags, isLoading } = useSelector((state) => state.videos);
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(fetchVideos());
        dispatch(fetchTags());
    }, [dispatch]);

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            dispatch(fetchVideos({ search: e.target.value }));
        }
    };

    const handleTagClick = (tag) => {
        dispatch(fetchVideos({ tag }));
    };

    // Direct Play (For Hero "Play" Button)
    const handlePlay = (videoId) => {
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            navigate(`/watch/${videoId}`);
        }
    };

    // Navigate to Details Page (For Cards & "More Info")
    const handleVideoClick = (videoId) => {
        navigate(`/title/${videoId}`);
    };

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '50px' }}>
            {/* Navbar */}
            <nav style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '20px 40px',
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 10%, rgba(0,0,0,0))',
                position: 'fixed',
                width: '100%',
                top: 0,
                zIndex: 100,
                boxSizing: 'border-box'
            }}>
                <div style={{ color: '#e50914', fontSize: '30px', fontWeight: 'bold' }}>NETFLIX-ISH</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={20} style={{ position: 'absolute', left: '10px', top: '8px', color: '#ccc' }} />
                        <input
                            type="text"
                            placeholder="Titles, people, genres"
                            onKeyDown={handleSearch}
                            style={{
                                background: 'rgba(0,0,0,0.75)',
                                border: '1px solid #ccc',
                                color: 'white',
                                padding: '8px 10px 8px 35px',
                                outline: 'none'
                            }}
                        />
                    </div>
                    {isAuthenticated ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ fontWeight: 'bold' }}>{user?.full_name}</span>
                            <button onClick={() => dispatch(logout())} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="btn-primary" style={{ textDecoration: 'none', padding: '5px 15px' }}>Sign In</Link>
                    )}
                </div>
            </nav>

            {/* Hero / Banner (First Video) */}
            {videos.length > 0 && (
                <div style={{
                    height: '80vh',
                    position: 'relative',
                    backgroundImage: `url(${videos[0].thumbnail_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'linear-gradient(to top, #141414 10%, transparent 90%)'
                    }}></div>

                    <div style={{
                        position: 'absolute', bottom: '35%', left: '40px',
                        maxWidth: '500px'
                    }}>
                        <h1 style={{ fontSize: '3rem', margin: 0, textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{videos[0].title}</h1>
                        <p style={{ fontSize: '1.2rem', margin: '20px 0', textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}>{videos[0].description}</p>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            {/* Play Button - Goes directly to Watch */}
                            <button
                                className="btn-primary"
                                style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem', padding: '10px 25px' }}
                                onClick={() => handlePlay(videos[0].id)}
                            >
                                <Play fill="white" size={24} /> Play
                            </button>

                            {/* More Info Button - Goes to Details Page */}
                            <button
                                onClick={() => handleVideoClick(videos[0].id)}
                                style={{
                                    background: 'rgba(109, 109, 110, 0.7)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 25px',
                                    fontSize: '1.2rem',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <Info size={24} /> More Info
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Rows */}
            <div style={{ padding: '20px 40px', marginTop: '-150px', position: 'relative', zIndex: 10 }}>

                {/* Filter Tags */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px' }}>
                    <button
                        onClick={() => dispatch(fetchVideos())}
                        style={{ background: '#333', border: '1px solid #fff', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                        All
                    </button>
                    {tags.map(tag => (
                        <button
                            key={tag.id}
                            onClick={() => handleTagClick(tag.name)}
                            style={{ background: 'rgba(109, 109, 110, 0.7)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                        >
                            {tag.name}
                        </button>
                    ))}
                </div>

                <h2 style={{ marginBottom: '10px' }}>Trending Now</h2>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '10px'
                }}>
                    {isLoading ? <p>Loading content...</p> : videos.map(video => (
                        <div
                            key={video.id}
                            style={{
                                position: 'relative',
                                aspectRatio: '16/9',
                                cursor: 'pointer',
                                transition: 'transform 0.3s',
                            }}
                            className="video-card"
                            onClick={() => handleVideoClick(video.id)} // CLICKING CARD GOES TO DETAILS
                        >
                            <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                            />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0,
                                padding: '10px',
                                background: 'rgba(0,0,0,0.7)',
                                opacity: 0,
                                transition: 'opacity 0.3s'
                            }} className="video-info">
                                <h4 style={{ margin: 0 }}>{video.title}</h4>
                                <div style={{ fontSize: '0.8rem', color: '#ccc' }}>{video.tags.join(' • ')}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .video-card:hover {
                    transform: scale(1.05);
                    z-index: 20;
                }
                .video-card:hover .video-info {
                    opacity: 1;
                }
            `}</style>
        </div>
    );
};

export default Home;