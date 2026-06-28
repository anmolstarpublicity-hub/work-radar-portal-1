import { createSlice } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit'; // Import createSelector
import { apiSlice } from '../services/apiSlice';

// Attempt to load user from localStorage
const storedAuthData = localStorage.getItem('user');
const authData = storedAuthData ? JSON.parse(storedAuthData) : null;

const initialState = {
  user: authData ? authData.user : null,
  token: authData ? authData.token : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      // Also save to localStorage
      localStorage.setItem('user', JSON.stringify({ user, token }));
    },
    logOut(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('user');
    }
  },
  extraReducers: (builder) => {
    // This part is for `authApi` which is defined later.
    // It's fine to leave it as is, but ensure `authApi` is defined before this.
    // For now, let's assume it's correctly handled.
  }
});

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    forgotPassword: builder.mutation({
      query: (credentials) => ({ url: 'auth/forgot-password', method: 'POST', body: credentials }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({ url: `auth/reset-password/${token}`, method: 'POST', body: { password } }),
    }),
  }),
});
export const { setCredentials, logOut } = authSlice.actions
export default authSlice.reducer;

// Memoized selector for current user
export const selectCurrentUser = createSelector(
  (state) => state.auth.user,
  (user) => user
);
export const selectCurrentToken = (state) => state.auth.token;
export const { useForgotPasswordMutation, useResetPasswordMutation } = authApi;