import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideoById, clearCurrentVideo } from '../redux/slices/videoSlice';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { ArrowLeft, Settings, Check } from 'lucide-react';

// Required for reading HLS levels
import 'videojs-contrib-quality-levels';

// Styles
import '../styles/Watch.css';

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
            : `http://localhost:5000/api/stream/${id}/master.m3u8`;

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

            const extractLevels = () => {
                const levels = [];
                for (let i = 0; i < qualityLevels.length; i++) {
                    const level = qualityLevels[i];
                    const label = level.height ? `${level.height}p` : `Level ${i}`;
                    levels.push({
                        index: i,
                        label,
                        height: level.height || 0,
                        bandwidth: level.bandwidth || 0
                    });
                }
                levels.sort((a, b) => b.height - a.height);
                return levels;
            };

            qualityLevels.on('addqualitylevel', () => {
                setTimeout(() => {
                    const levels = extractLevels();
                    if (levels.length > 0) setQualities(levels);
                }, 500);
            });

            player.on('loadedmetadata', () => {
                setTimeout(() => {
                    if (qualityLevels.length > 0) {
                        const levels = extractLevels();
                        if (levels.length > 0) setQualities(levels);
                    }
                }, 1000);
            });

            // Fallback check after 3 seconds
            setTimeout(() => {
                if (qualityLevels.length > 0) {
                    const levels = extractLevels();
                    if (levels.length > 0) setQualities((prev) => (prev.length === 0 ? levels : prev));
                }
            }, 3000);

            // Track auto-selected quality
            qualityLevels.on('change', () => {
                if (currentQualityIndex === -1) {
                    for (let i = 0; i < qualityLevels.length; i++) {
                        if (qualityLevels[i].enabled) {
                            const activeHeight = qualityLevels[i].height;
                            setCurrentQualityLabel(`Auto (${activeHeight}p)`);
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
            for (let i = 0; i < qualityLevels.length; i++) {
                qualityLevels[i].enabled = true;
            }
        } else {
            for (let i = 0; i < qualityLevels.length; i++) {
                qualityLevels[i].enabled = false;
            }
            qualityLevels[index].enabled = true;
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
            <div className="watch-page__error">
                <h2>Error Loading Video</h2>
                <p>{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="watch-page__error-btn"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="watch-page">
            {/* Back Button */}
            <button
                className="watch-page__overlay-btn watch-page__back-btn"
                onClick={() => navigate('/')}
            >
                <ArrowLeft color="white" size={28} />
            </button>

            {/* Settings Icon */}
            <button
                ref={settingsButtonRef}
                className="watch-page__overlay-btn watch-page__settings-btn"
                onClick={() => setShowQualityMenu(!showQualityMenu)}
            >
                <Settings color="white" size={28} />
            </button>

            {/* Quality Dropdown Menu */}
            {showQualityMenu && (
                <div ref={qualityMenuRef} className="quality-menu">
                    <div className="quality-menu__header">Quality Settings</div>
                    <div className="quality-menu__current">
                        Current: {currentQualityLabel}
                    </div>

                    {qualities.length > 0 ? (
                        <>
                            {/* Auto Option */}
                            <div
                                className={`quality-item ${currentQualityIndex === -1 ? 'quality-item--active' : 'quality-item--inactive'}`}
                                onClick={() => handleQualityChange(-1, 'Auto')}
                            >
                                <div>
                                    <div>Auto</div>
                                    <div className="quality-item__sublabel">
                                        Adapts to connection
                                    </div>
                                </div>
                                {currentQualityIndex === -1 && <Check size={20} strokeWidth={3} />}
                            </div>

                            {/* Quality List */}
                            {qualities.map((q) => (
                                <div
                                    key={q.index}
                                    className={`quality-item ${currentQualityIndex === q.index ? 'quality-item--active' : 'quality-item--inactive'}`}
                                    onClick={() => handleQualityChange(q.index, q.label)}
                                >
                                    <div>
                                        <div>{q.label}</div>
                                        <div className="quality-item__sublabel">
                                            {(q.bandwidth / 1000000).toFixed(1)} Mbps
                                        </div>
                                    </div>
                                    {currentQualityIndex === q.index && <Check size={20} strokeWidth={3} />}
                                </div>
                            ))}
                        </>
                    ) : (
                        <div className="quality-menu__empty">
                            <div style={{ marginBottom: '8px' }}>⏳ Detecting quality levels...</div>
                            <div className="quality-menu__empty-sub">
                                This stream may only have one quality level.
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Video Player */}
            {currentVideo && currentVideo.id == id ? (
                <div ref={videoContainerRef} className="watch-page__player-container" />
            ) : (
                <div className="watch-page__loading">
                    <div className="watch-page__spinner" />
                    Loading Player...
                </div>
            )}
        </div>
    );
};

export default Watch;