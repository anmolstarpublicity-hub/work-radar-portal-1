// src/services/apiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
 
// During development the frontend is served by Vite (usually on :5173/5174)
// while the API runs on a separate Express server (default port 2000).
// Use the backend origin in DEV so requests go to the API server, and use
// the relative path in production where Nginx proxies `/workradar/api`.
const resolvedBaseUrl = import.meta.env.DEV ? 'http://localhost:2000/workradar/api' : '/workradar/api';

const baseQuery = fetchBaseQuery({
  baseUrl: resolvedBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If a request fails with a 401 Unauthorized or 403 Forbidden,
  // it means the token is invalid or expired. We dispatch the logOut action
  // to reset the client-side auth state for 401 errors.
  if (result.error && result.error.status === 401) {
    // Don't log 401 errors to console to reduce noise during automatic logout
    api.dispatch({ type: 'auth/logOut' });
    // Reset the API state to clear cached data for all endpoints
    api.dispatch(apiSlice.util.resetApiState());
  }

  return result;
};

// Define a core service using a base URL - other API slices will inject endpoints
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Employee', 'Report', 'User', 'Task', 'Notification', 'Leave', 'Holiday', 'Announcement', 'EOMHistory', 'EOMOfficial', 'CompanyInfo'], // Define tag types for caching
  endpoints: (builder) => ({
    logout: builder.mutation({
      query: () => ({ url: '/logout', method: 'POST' }),
      async onQueryStarted(arg, { dispatch }) {
        dispatch({ type: 'auth/logOut' });
        // Reset the entire API state to clear out any cached data
        dispatch(apiSlice.util.resetApiState());
      },
    }),
  }), // Endpoints are injected from other files
});

// Export the auto-generated hook for the logout mutation
export const { useLogoutMutation } = apiSlice;