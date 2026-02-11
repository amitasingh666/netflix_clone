import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideoById, clearCurrentVideo } from '../redux/slices/videoSlice';
import { API_BASE_URL } from '../config';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { ArrowLeft, Settings, Check } from 'lucide-react';

// Required for reading HLS levels
import 'videojs-contrib-quality-levels';

const Watch = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentVideo, error } = useSelector((state) => state.videos);
    const { isAuthenticated } = useSelector((state) => state.auth);

    const videoContainerRef = useRef(null);
    const playerRef = useRef(null);
    const qualityMenuRef = useRef(null);
    const settingsButtonRef = useRef(null);

    // STATE FOR CUSTOM QUALITY MENU
    const [qualities, setQualities] = useState([]);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [currentQualityIndex, setCurrentQualityIndex] = useState(-1); // -1 = Auto
    const [currentQualityLabel, setCurrentQualityLabel] = useState('Auto');

    // 1. Fetch Video Logic
    useEffect(() => {
        if (isAuthenticated) {
            if (!currentVideo || currentVideo.id != id) {
                dispatch(fetchVideoById(id));
            }
        }
    }, [id, isAuthenticated, dispatch, currentVideo]);

    // 2. Click Outside Handler - Close Quality Menu
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                qualityMenuRef.current &&
                !qualityMenuRef.current.contains(event.target) &&
                settingsButtonRef.current &&
                !settingsButtonRef.current.contains(event.target)
            ) {
                setShowQualityMenu(false);
            }
        };

        if (showQualityMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showQualityMenu]);

    // 3. Player Logic
    useEffect(() => {
        if (!isAuthenticated || !currentVideo || currentVideo.id != id || !videoContainerRef.current) return;

        const isExternal = currentVideo.video_url && currentVideo.video_url.startsWith('http');
        const videoSrc = isExternal
            ? currentVideo.video_url
            : `${API_BASE_URL}/api/stream/${id}/master.m3u8`;

        const initPlayer = () => {
            if (playerRef.current) {
                playerRef.current.src({ src: videoSrc, type: 'application/x-mpegURL' });
                return;
            }

            const videoJsOptions = {
                autoplay: true,
                controls: true,
                responsive: true,
                fill: true,
                controlBar: {
                    children: [
                        'playToggle',
                        'volumePanel',
                        'currentTimeDisplay',
                        'timeDivider',
                        'durationDisplay',
                        'progressControl',
                        'remainingTimeDisplay',
                        'fullscreenToggle'
                    ]
                },
                sources: [{
                    src: videoSrc,
                    type: 'application/x-mpegURL'
                }],
                html5: {
                    // Use Video.js HTTP Streaming (VHS) for BOTH local and external HLS.
                    // This ensures .m3u8 manifests are parsed by VHS so that
                    // videojs-contrib-quality-levels can detect all variants,
                    // enabling both auto-quality (ABR) and manual overrides.
                    vhs: {
                        withCredentials: !isExternal,
                        overrideNative: true
                    }
                }
            };

            const videoElement = document.createElement("video-js");
            videoElement.classList.add('vjs-big-play-centered');
            videoContainerRef.current.appendChild(videoElement);

            const player = playerRef.current = videojs(videoElement, videoJsOptions);

            // --- QUALITY DETECTION LOGIC ---
            const qualityLevels = player.qualityLevels();
            console.log("🎬 Player initialized. Quality Levels plugin:", qualityLevels);

            qualityLevels.on('addqualitylevel', () => {
                console.log("🔔 Quality level added event fired!");
                setTimeout(() => {
                    const levels = [];
                    console.log(`📊 Total quality levels detected: ${qualityLevels.length}`);

                    for (let i = 0; i < qualityLevels.length; i++) {
                        const level = qualityLevels[i];
                        console.log(`  Level ${i}:`, {
                            height: level.height,
                            width: level.width,
                            bandwidth: level.bandwidth,
                            bitrate: level.bitrate
                        });

                        const label = level.height ? `${level.height}p` : `Level ${i}`;
                        levels.push({
                            index: i,
                            label: label,
                            height: level.height || 0,
                            bandwidth: level.bandwidth || 0
                        });
                    }

                    levels.sort((a, b) => b.height - a.height);
                    setQualities(levels);
                    console.log("✅ Quality Levels Set:", levels);
                }, 500);
            });

            // Also check when video metadata loads
            player.on('loadedmetadata', () => {
                console.log("📹 Video metadata loaded, checking for quality levels...");
                setTimeout(() => {
                    if (qualityLevels.length > 0 && qualities.length === 0) {
                        const levels = [];
                        for (let i = 0; i < qualityLevels.length; i++) {
                            const level = qualityLevels[i];
                            const label = level.height ? `${level.height}p` : `Level ${i}`;
                            levels.push({
                                index: i,
                                label: label,
                                height: level.height || 0,
                                bandwidth: level.bandwidth || 0
                            });
                        }
                        levels.sort((a, b) => b.height - a.height);
                        setQualities(levels);
                        console.log("✅ Quality Levels Set (from metadata):", levels);
                    }
                }, 1000);
            });

            // Fallback check after 3 seconds
            setTimeout(() => {
                console.log("⏰ Fallback quality check...");
                if (qualityLevels.length > 0 && qualities.length === 0) {
                    const levels = [];
                    for (let i = 0; i < qualityLevels.length; i++) {
                        const level = qualityLevels[i];
                        const label = level.height ? `${level.height}p` : `Level ${i}`;
                        levels.push({
                            index: i,
                            label: label,
                            height: level.height || 0,
                            bandwidth: level.bandwidth || 0
                        });
                    }
                    levels.sort((a, b) => b.height - a.height);
                    setQualities(levels);
                    console.log("✅ Quality Levels Set (fallback):", levels);
                }
            }, 3000);

            // Track auto-selected quality
            qualityLevels.on('change', () => {
                console.log("🔄 Quality level changed ");
                if (currentQualityIndex === -1) {
                    for (let i = 0; i < qualityLevels.length; i++) {
                        if (qualityLevels[i].enabled) {
                            const activeHeight = qualityLevels[i].height;
                            setCurrentQualityLabel(`Auto (${activeHeight}p)`);
                            console.log(`📺 Auto-selected: ${activeHeight}p`);
                            break;
                        }
                    }
                }
            });
        };

        const timer = requestAnimationFrame(initPlayer);
        return () => cancelAnimationFrame(timer);

    }, [currentVideo, id, isAuthenticated]);

    // 4. Handle Quality Change
    const handleQualityChange = (index, label) => {
        if (!playerRef.current) return;

        const qualityLevels = playerRef.current.qualityLevels();
        const currentTime = playerRef.current.currentTime();

        setCurrentQualityIndex(index);
        setCurrentQualityLabel(label);
        setShowQualityMenu(false);

        if (index === -1) {
            // Auto Mode
            for (let i = 0; i < qualityLevels.length; i++) {
                qualityLevels[i].enabled = true;
            }
            console.log("✓ Switched to Auto Quality");
        } else {
            // Manual Lock
            for (let i = 0; i < qualityLevels.length; i++) {
                qualityLevels[i].enabled = false;
            }
            qualityLevels[index].enabled = true;
            console.log(`✓ Locked to ${label}`);
        }

        setTimeout(() => {
            if (playerRef.current) {
                playerRef.current.currentTime(currentTime);
            }
        }, 100);
    };

    // 5. Cleanup
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
            dispatch(clearCurrentVideo());
        };
    }, [dispatch]);

    if (!isAuthenticated) return null;

    if (error) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                color: 'white',
                background: '#000'
            }}>
                <h2>Error Loading Video</h2>
                <p>{error}</p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        marginTop: '20px',
                        padding: '10px 20px',
                        background: '#e50914',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div style={{
            background: '#000',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            position: 'relative'
        }}>
            <style>{`
                /* Player Sizing */
                .video-js { 
                    width: 100% !important; 
                    height: 100% !important; 
                }
                .vjs-tech { 
                    width: 100% !important; 
                    height: 100% !important; 
                }

                /* Custom Quality Button Styles */
                .vjs-quality-button {
                    cursor: pointer;
                    font-size: 1.5em;
                }

                .vjs-quality-button .vjs-icon-placeholder svg {
                    width: 20px;
                    height: 20px;
                    vertical-align: middle;
                }

                .vjs-quality-button:hover .vjs-icon-placeholder svg {
                    filter: brightness(1.3);
                }

                /* Quality Menu Animation */
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .quality-menu {
                    animation: slideUp 0.2s ease-out;
                }

                /* Quality Item Hover */
                .quality-item:hover {
                    background: rgba(255,255,255,0.2) !important;
                }

                /* Hide default quality selector if any */
                .vjs-quality-selector {
                    display: none !important;
                }
            `}</style>

            {/* Back Button */}
            <div
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 100,
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    padding: '12px',
                    transition: 'all 0.3s',
                }}
                onClick={() => navigate('/')}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(229, 9, 20, 0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            >
                <ArrowLeft color="white" size={28} />
            </div>

            {/* Settings Icon (Overlay) - Top Right - ALWAYS VISIBLE */}
            <div
                ref={settingsButtonRef}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000, // Higher z-index to ensure it's above video player
                    cursor: 'pointer',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    padding: '12px',
                    transition: 'all 0.3s',
                }}
                onClick={() => {
                    console.log("Settings icon clicked. Qualities:", qualities);
                    setShowQualityMenu(!showQualityMenu);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(229, 9, 20, 0.9)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.7)'}
            >
                <Settings color="white" size={28} />
            </div>

            {/* Quality Dropdown Menu - Positioned below settings icon */}
            {showQualityMenu && (
                <div
                    ref={qualityMenuRef}
                    className="quality-menu"
                    style={{
                        position: 'absolute',
                        top: '70px', // Below settings icon
                        right: '20px', // Aligned with settings icon
                        background: 'rgba(0, 0, 0, 0.95)',
                        borderRadius: '8px',
                        padding: '8px 0',
                        minWidth: '220px',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        zIndex: 200
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid rgba(255,255,255,0.15)',
                        marginBottom: '6px',
                        color: '#aaa',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                    }}>
                        Quality Settings
                    </div>

                    {/* Current Selection Indicator */}
                    <div style={{
                        padding: '8px 16px',
                        color: '#e50914',
                        fontSize: '0.85rem',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        marginBottom: '6px',
                        fontWeight: '500'
                    }}>
                        Current: {currentQualityLabel}
                    </div>

                    {/* Quality Options or Message */}
                    {qualities.length > 0 ? (
                        <>
                            {/* Auto Option */}
                            <div
                                className="quality-item"
                                onClick={() => handleQualityChange(-1, 'Auto')}
                                style={{
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    color: currentQualityIndex === -1 ? '#e50914' : 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '1rem',
                                    fontWeight: currentQualityIndex === -1 ? '600' : '400',
                                    background: currentQualityIndex === -1 ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                                    transition: 'all 0.2s',
                                    borderLeft: currentQualityIndex === -1 ? '3px solid #e50914' : '3px solid transparent'
                                }}
                            >
                                <div>
                                    <div>Auto</div>
                                    <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>
                                        Adapts to connection
                                    </div>
                                </div>
                                {currentQualityIndex === -1 && <Check size={20} strokeWidth={3} />}
                            </div>

                            {/* Quality List */}
                            {qualities.map((q) => (
                                <div
                                    key={q.index}
                                    className="quality-item"
                                    onClick={() => handleQualityChange(q.index, q.label)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        color: currentQualityIndex === q.index ? '#e50914' : 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        fontSize: '1rem',
                                        fontWeight: currentQualityIndex === q.index ? '600' : '400',
                                        background: currentQualityIndex === q.index ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                                        transition: 'all 0.2s',
                                        borderLeft: currentQualityIndex === q.index ? '3px solid #e50914' : '3px solid transparent'
                                    }}
                                >
                                    <div>
                                        <div>{q.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '2px' }}>
                                            {(q.bandwidth / 1000000).toFixed(1)} Mbps
                                        </div>
                                    </div>
                                    {currentQualityIndex === q.index && <Check size={20} strokeWidth={3} />}
                                </div>
                            ))}
                        </>
                    ) : (
                        <div style={{
                            padding: '20px 16px',
                            color: '#999',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            lineHeight: '1.5'
                        }}>
                            <div style={{ marginBottom: '8px' }}>⏳ Detecting quality levels...</div>
                            <div style={{ fontSize: '0.75rem' }}>
                                This stream may only have one quality level.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Video Player */}
            {currentVideo && currentVideo.id == id ? (
                <div ref={videoContainerRef} style={{ width: '100%', height: '100%' }} />
            ) : (
                <div style={{
                    color: 'white',
                    textAlign: 'center',
                    marginTop: '20%',
                    fontSize: '1.2rem'
                }}>
                    <div className="spinner" style={{
                        border: '4px solid rgba(255,255,255,0.1)',
                        borderTop: '4px solid #e50914',
                        borderRadius: '50%',
                        width: '50px',
                        height: '50px',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                    }}></div>
                    Loading Player...
                </div>
            )}

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Watch;