import { apiSlice } from './apiSlice'; // Assuming apiSlice is defined here

export const extendedApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Auth Endpoints (moved from authSlice to here for consistency with other RTK Query hooks)
    // Note: These are typically defined in a separate authApiSlice if they don't directly
    // interact with 'Employee' tags, but for consolidation, they are placed here.
    login: builder.mutation({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      // Does not invalidate tags, as login typically just sets credentials
    }),
    // Employee Management
    getEmployees: builder.query({
      query: () => '/employees',
      providesTags: ['Employee'],
    }),
    getEmployeeById: builder.query({
      query: (id) => `/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),
    addEmployee: builder.mutation({
      query: (employeeData) => ({
        url: '/employees',
        method: 'POST',
        body: employeeData,
      }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/employees/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => ['Employee', { type: 'Employee', id }],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({
        url: `/employees/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Employee'],
    }),
    getDashboardStats: builder.query({
      query: () => '/stats',
      providesTags: ['DashboardStats'],
    }),
    getEmployeeOfTheMonthCandidates: builder.query({
      query: ({ month, year }) => `/employees/employee-of-the-month?month=${month}&year=${year}`,
      providesTags: ['EOMCandidates'],
    }),
    getEmployeeEOMHistory: builder.query({
      query: (employeeId) => `/employees/${employeeId}/eom-history`,
      providesTags: (result, error, employeeId) => [{ type: 'EOMHistory', id: employeeId }],
    }),
    getOfficialEOM: builder.query({
      query: ({ month, year }) => `/employees/official-eom?month=${month}&year=${year}`,
      providesTags: ['EOMOfficial'],
    }),
    setEmployeeOfTheMonth: builder.mutation({
      query: (eomData) => ({
        url: '/employees/employee-of-the-month',
        method: 'POST',
        body: eomData,
      }),
      invalidatesTags: ['EOMCandidates', 'EOMOfficial', 'Announcement'], // Invalidate relevant tags
    }),
    getHallOfFame: builder.query({
      query: () => '/employees/hall-of-fame',
      providesTags: ['EOMOfficial'], // Assuming Hall of Fame data relates to EOM
    }),

    // Task Management
    createTask: builder.mutation({
      query: (taskData) => ({
        url: '/tasks',
        method: 'POST',
        body: taskData,
      }),
      invalidatesTags: ['Task'],
    }),
    createMultipleTasks: builder.mutation({
      query: (tasksData) => ({
        url: '/tasks/multiple',
        method: 'POST',
        body: tasksData,
      }),
      invalidatesTags: ['Task'],
    }),
    getMyTasks: builder.query({
      query: () => '/tasks/my',
      providesTags: ['Task'],
    }),
    getAllTasks: builder.query({
      query: () => '/tasks/all',
      providesTags: ['Task'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => ['Task', { type: 'Task', id }],
    }),
    processPastDueTasks: builder.mutation({
      query: () => ({
        url: '/tasks/process-due-tasks',
        method: 'POST',
      }),
      invalidatesTags: ['Task'],
    }),
    getTasksForApproval: builder.query({
      query: () => '/tasks/for-approval',
      providesTags: ['Task', 'Notification'],
    }),

    // Report Management
    getTodaysReport: builder.query({
      query: (employeeId) => `/reports/my-today/${employeeId}`,
      providesTags: ['Report'],
    }),
    updateTodaysReport: builder.mutation({
      query: ({ employeeId, ...patch }) => ({
        url: `/reports/my-today/${employeeId}`,
        method: 'POST',
        body: patch,
      }),
      invalidatesTags: ['Report', 'Notification'],
    }),
    getAllMyReports: builder.query({
      query: (employeeId) => `/reports/my-all/${employeeId}`,
      providesTags: ['Report'],
    }),

    // Announcement Management
    // Active announcement for the current user (server route: /announcements/active)
    getActiveAnnouncement: builder.query({
      query: () => '/announcements/active',
      providesTags: ['Announcement'],
    }),
    // Admin: fetch all announcements (server route: /announcements)
    getAllAnnouncements: builder.query({
      query: () => '/announcements',
      providesTags: ['Announcement'],
    }),
    createAnnouncement: builder.mutation({
      query: (announcementData) => ({ url: '/announcements', method: 'POST', body: announcementData }),
      invalidatesTags: ['Announcement'],
    }),
    deleteAnnouncement: builder.mutation({
      query: (id) => ({ url: `/announcements/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Announcement'],
    }),
    dismissAnnouncement: builder.mutation({
      query: (id) => ({
        url: `/announcements/${id}/dismiss`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => ['Announcement', { type: 'Announcement', id }],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          apiSlice.util.updateQueryData('getActiveAnnouncement', undefined, (draft) => {
            if (draft && draft._id === id) return undefined;
            return draft;
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Holiday Management
    getHolidays: builder.query({
      query: () => '/holidays',
      providesTags: ['Holiday'],
    }),

    // Attendance Management
    getAttendanceForMonth: builder.query({
      query: ({ employeeId, year, month }) => `/attendance/${employeeId}?year=${year}&month=${month}`,
      providesTags: ['Attendance'],
    }),
    addHoliday: builder.mutation({
      query: (holidayData) => ({
        url: '/holidays',
        method: 'POST',
        body: holidayData,
      }),
      invalidatesTags: ['Holiday'],
    }),
    deleteHoliday: builder.mutation({
      query: (id) => ({
        url: `/holidays/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Holiday'],
    }),

    // Setup Endpoints
    checkAdminSetup: builder.query({
      query: () => '/setup/check',
      providesTags: ['Setup'],
    }),
    createAdmin: builder.mutation({
      query: (adminData) => ({
        url: '/setup/create-admin',
        method: 'POST',
        body: adminData,
      }),
      invalidatesTags: ['Setup', 'Employee'],
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['Employee'],
    }),

    // Settings Endpoints
    getScoringSettings: builder.query({
      query: () => '/settings/scoring',
      providesTags: ['ScoringSettings'],
    }),
    updateScoringSettings: builder.mutation({
      query: (settingsData) => ({
        url: '/settings/scoring',
        method: 'PUT',
        body: settingsData,
      }),
      invalidatesTags: ['ScoringSettings'],
    }),
    // Company Info
    forgotPassword: builder.mutation({
      query: (credentials) => ({ url: '/auth/forgot-password', method: 'POST', body: credentials }),
    }),
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({ url: `/auth/reset-password/${token}`, method: 'POST', body: { password } }),
    }),

    // Company Info
    getCompanyInfo: builder.query({
      query: () => '/setup/company-info',
      providesTags: ['CompanyInfo'],
    }),

    // Notifications
    getMyNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationsAsRead: builder.mutation({
      query: () => ({ url: '/notifications/mark-read', method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
    deleteReadNotifications: builder.mutation({
      query: () => ({ url: '/notifications/read', method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useLoginMutation, // Exported
  useGetEmployeesQuery,
  useGetEmployeeByIdQuery,
  useAddEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetDashboardStatsQuery,
  useGetEmployeeOfTheMonthCandidatesQuery,
  useGetEmployeeEOMHistoryQuery,
  useSetEmployeeOfTheMonthMutation, // Exported
  useGetHallOfFameQuery, // Exported
  useGetOfficialEOMQuery, // Exported
  useCreateTaskMutation,
  useCreateMultipleTasksMutation,
  useGetMyTasksQuery,
  useGetAllTasksQuery,
  useUpdateTaskMutation,
  useProcessPastDueTasksMutation,
  useDeleteTaskMutation, // Exported
  useAddTaskCommentMutation, // Export the new mutation
  useApproveTaskMutation, // Exported
  useRejectTaskMutation, // Exported
  useGetTasksForApprovalQuery,
  useGetTodaysReportQuery,
  useUpdateTodaysReportMutation,
  useGetAllMyReportsQuery,
  useGetReportsByEmployeeQuery, // Exported
  useDeleteReportMutation, // Exported
  useGetActiveAnnouncementQuery,
  useGetAllAnnouncementsQuery, // Exported
  useCreateAnnouncementMutation, // Exported
  useDeleteAnnouncementMutation, // Exported
  useDismissAnnouncementMutation,
  useGetMyNotificationsQuery, // Exported
  useMarkNotificationsAsReadMutation, // Exported
  useDeleteReadNotificationsMutation, // Exported
  useAddHolidayMutation, // Export the new mutation
  useDeleteHolidayMutation, // Export the new mutation
  useCheckAdminSetupQuery, // Exported
  useCreateAdminMutation, // Exported
  useGetMeQuery, // Exported
  useGetScoringSettingsQuery, // Exported
  useForgotPasswordMutation, // Exported (from authSlice)
  useResetPasswordMutation, // Exported (from authSlice)
  useUpdateScoringSettingsMutation, // Exported,
  useAssignEmployeeMutation,
  useUnassignEmployeeMutation, // Export the new mutation
  useAddLeaveMutation, // Export the new mutation
  useRemoveLeaveMutation,
  useGetLeavesForEmployeeQuery,
  useGetAttendanceForMonthQuery, // Exported
  useGetHolidaysQuery,
  useGetCompanyInfoQuery,
} = extendedApi;