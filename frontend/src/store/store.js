import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import videoReducer from '../features/videos/videoSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        videos: videoReducer,
    },
});
