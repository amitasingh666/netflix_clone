import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './redux/slices/authSlice';

import Home from './pages/Home';
import Watch from './pages/Watch';
import VideoDetails from './pages/VideoDetails';
import VideoUpload from './pages/VideoUpload';

function App() {
    const dispatch = useDispatch();
    const { isAuthenticated, isCheckingAuth } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    if (isCheckingAuth) {
        return <div className="video-details__loading">Loading...</div>
    }

    return (
        <Router>
            <Routes>
                <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />

                <Route path="/" element={<Home />} />

                {/* NEW ROUTE FOR DETAILS PAGE */}
                <Route path="/title/:id" element={<VideoDetails />} />

                {/* Upload Route - Protected */}
                <Route path="/upload" element={isAuthenticated ? <VideoUpload /> : <Navigate to="/login" />} />

                {/* Watch Route is protected (optional: you can remove the check here if Watch.jsx handles redirect) */}
                <Route path="/watch/:id" element={isAuthenticated ? <Watch /> : <Navigate to="/login" />} />
            </Routes>
        </Router>
    );
}

export default App;