import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos, fetchTags } from '../redux/slices/videoSlice';
import useVideoNavigation from '../hooks/useVideoNavigation';

// Sub-components
import { Navbar, HeroBanner, TagFilter, VideoGrid } from '../components/Home';

// Styles
import '../styles/Home.css';

const Home = () => {
    const dispatch = useDispatch();
    const { videos, tags, isLoading } = useSelector((state) => state.videos);
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const { handlePlay, handleVideoClick } = useVideoNavigation();

    useEffect(() => {
        dispatch(fetchVideos());
        dispatch(fetchTags());
    }, [dispatch]);

    return (
        <div className="home-page">
            <Navbar user={user} isAuthenticated={isAuthenticated} />

            {videos.length > 0 && (
                <HeroBanner
                    video={videos[0]}
                    onPlay={handlePlay}
                    onMoreInfo={handleVideoClick}
                />
            )}

            <div className="content-section">
                <TagFilter tags={tags} />
                <VideoGrid
                    videos={videos}
                    isLoading={isLoading}
                    onVideoClick={handleVideoClick}
                />
            </div>
        </div>
    );
};

export default Home;