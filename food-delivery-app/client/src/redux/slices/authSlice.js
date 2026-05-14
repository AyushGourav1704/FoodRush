import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.login(creds);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchProfile = createAsyncThunk('auth/profile', async (_, { rejectWithValue }) => {
  try {
    const { data } = await authAPI.getProfile();
    return data.user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, loading: false, error: null, isAuthenticated: false },
  reducers: {
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    clearError(state) { state.error = null; },
    updateUser(state, action) { state.user = { ...state.user, ...action.payload }; }
  },
  extraReducers: (builder) => {
    const pending = (state) => { state.loading = true; state.error = null; };
    const fulfilled = (state, { payload }) => { state.loading = false; state.user = payload; state.isAuthenticated = true; };
    const rejected = (state, { payload }) => { state.loading = false; state.error = payload; };
    builder
      .addCase(loginUser.pending, pending).addCase(loginUser.fulfilled, fulfilled).addCase(loginUser.rejected, rejected)
      .addCase(registerUser.pending, pending).addCase(registerUser.fulfilled, fulfilled).addCase(registerUser.rejected, rejected)
      .addCase(fetchProfile.pending, pending).addCase(fetchProfile.fulfilled, fulfilled).addCase(fetchProfile.rejected, (state) => { state.loading = false; });
  }
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
