import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

/**
 * Custom hook that encapsulates video navigation logic.
 * Handles auth-gated playback and details page routing.
 */
const useVideoNavigation = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useSelector((state) => state.auth);

    /** Navigate to the watch page (requires auth) */
    const handlePlay = useCallback(
        (videoId) => {
            if (!isAuthenticated) {
                navigate('/login');
            } else {
                navigate(`/watch/${videoId}`);
            }
        },
        [isAuthenticated, navigate]
    );

    /** Navigate to the video details/title page */
    const handleVideoClick = useCallback(
        (videoId) => {
            navigate(`/title/${videoId}`);
        },
        [navigate]
    );

    return { handlePlay, handleVideoClick };
};

export default useVideoNavigation;
