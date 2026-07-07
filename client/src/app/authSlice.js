import { createSlice } from '@reduxjs/toolkit';
// createSelector not needed for simple pass-through selectors

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
      // Clear any session-scoped announcement dismissals so announcements reappear on next login
      try {
        // Remove array-based session dismissal key
        sessionStorage.removeItem('dismissedAnnouncements_session');
        // Remove any per-announcement session keys like 'announcementDismissed_session_<id>'
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('announcementDismissed_session_')) keysToRemove.push(k);
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
      } catch {
        // ignore sessionStorage cleanup errors
      }
    }
  },
  extraReducers: (builder) => {
    // This part is for `authApi` which is defined later.
    // It's fine to leave it as is, but ensure `authApi` is defined before this.
    // For now, let's assume it's correctly handled.
  }
});

export const { setCredentials, logOut } = authSlice.actions
export default authSlice.reducer;

// Simple selectors for current user and token
export const selectCurrentUser = (state) => state.auth.user;
export const selectCurrentToken = (state) => state.auth.token;
// Note: RTK Query hooks (forgot/reset password) are defined in services/EmployeApi.js
// and should be imported from there where needed. Do not export them from the auth slice.