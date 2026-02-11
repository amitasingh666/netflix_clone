import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

// --- ASYNC THUNKS ---

export const login = createAsyncThunk('auth/login', async (userData, thunkAPI) => {
    try {
        const response = await axios.post(`${API_URL}/login`, userData);
        return response.data.user;
    } catch (error) {
        const message =
            (error.response && error.response.data && error.response.data.msg) ||
            error.message ||
            'Login failed';
        return thunkAPI.rejectWithValue(message);
    }
});

export const register = createAsyncThunk('auth/register', async (userData, thunkAPI) => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    } catch (error) {
        const message =
            (error.response && error.response.data && error.response.data.errors && error.response.data.errors[0].msg) ||
            (error.response && error.response.data && error.response.data.msg) ||
            error.message ||
            'Registration failed';
        return thunkAPI.rejectWithValue(message);
    }
});

export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
    await axios.post(`${API_URL}/logout`);
    return;
});

export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, thunkAPI) => {
    try {
        const response = await axios.get(`${API_URL}/me`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response ? error.response.data : 'Network Error');
    }
});

// --- SLICE ---

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        isCheckingAuth: true,
        error: null,
    },
    reducers: {
        resetError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Login failed";
            })

            // Register
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isAuthenticated = true;
                state.user = action.payload.user;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload || "Registration failed";
            })

            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            })

            // Check Auth
            .addCase(checkAuth.pending, (state) => {
                state.isCheckingAuth = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isCheckingAuth = false;
                state.isAuthenticated = action.payload.isAuthenticated;
                state.user = action.payload.user;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isCheckingAuth = false;
                state.isAuthenticated = false;
                state.user = null;
            });
    },
});

export const { resetError } = authSlice.actions;
export default authSlice.reducer;
