import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/videos';

// Fetch all videos
// Supports:
// - search: string
// - tag: single tag name
// - tags: array of tag names (multi-select)
export const fetchVideos = createAsyncThunk(
    'videos/fetchAll',
    async ({ search = '', tag = '', tags = [] } = {}, thunkAPI) => {
        try {
            const params = new URLSearchParams();

            if (search) {
                params.append('search', search);
            }

            let selectedTags = [];
            if (Array.isArray(tags) && tags.length > 0) {
                selectedTags = tags;
            } else if (tag) {
                selectedTags = [tag];
            }

            if (selectedTags.length > 0) {
                params.append('tags', selectedTags.join(','));
            }

            const queryString = params.toString();
            const url = queryString ? `${API_URL}?${queryString}` : API_URL;

            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch videos');
        }
    }
);

// Fetch single video
export const fetchVideoById = createAsyncThunk('videos/fetchById', async (id, thunkAPI) => {
    try {
        const response = await axios.get(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.msg || 'Failed to load video');
    }
});

// Fetch tags
export const fetchTags = createAsyncThunk('videos/fetchTags', async (_, thunkAPI) => {
    try {
        const response = await axios.get(`${API_URL}/tags`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response.data);
    }
});

const videoSlice = createSlice({
    name: 'videos',
    initialState: {
        videos: [],
        currentVideo: null,
        tags: [],
        isLoading: false,
        error: null,
    },
    reducers: {
        clearCurrentVideo: (state) => {
            state.currentVideo = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchVideos.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchVideos.fulfilled, (state, action) => {
                state.isLoading = false;
                state.videos = action.payload;
            })
            .addCase(fetchVideos.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch Single
            .addCase(fetchVideoById.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchVideoById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentVideo = action.payload;
            })
            .addCase(fetchVideoById.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // Fetch Tags
            .addCase(fetchTags.fulfilled, (state, action) => {
                state.tags = action.payload;
            });
    },
});

export const { clearCurrentVideo } = videoSlice.actions;
export default videoSlice.reducer;
