// services.js
import apiClient from './client';

// Task Status Enum
export const TaskStatus = {
  ToDo: 0,
  InProgress: 1,
  InReview: 2,
  Done: 3,
  Cancelled: 4
};

// Task Priority Enum  
export const TaskPriority = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3
};

// Authentication Services
export const authService = {
  login: async (data) => {
    const response = await apiClient.post('/api/auth/login', data);
    return response.data;
  },

  register: async (data) => {
    await apiClient.post('/api/auth/register', data);
  },

  logout: async () => {
    await apiClient.post('/api/auth/logout');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/api/auth/me');
    return response.data;
  },
};

// Task Services
export const taskService = {
  getMyTasks: async (queryString = '') => {
    const url = queryString ? `/api/tasks/mytasks?${queryString}` : '/api/tasks/mytasks';
    const response = await apiClient.get(url);
    return response.data;
  },

  getTeamTasks: async (queryString = '') => {
    const url = queryString ? `/api/tasks/team-tasks?${queryString}` : '/api/tasks/team-tasks';
    const response = await apiClient.get(url);
    return response.data;
  },

  createTask: async (data) => {
    const response = await apiClient.post('/api/tasks', data);
    return response.data;
  },

  updateTaskStatus: async (taskId, data) => {
    await apiClient.put(`/api/tasks/${taskId}/status`, data);
  },

  approveTask: async (taskId) => {
    await apiClient.put(`/api/tasks/${taskId}/approve`);
  },

  reopenTask: async (taskId, data) => {
    await apiClient.put(`/api/tasks/${taskId}/reopen`, data);
  },

  deleteTask: async (taskId) => {
    await apiClient.delete(`/api/tasks/${taskId}`);
  },
};

// Activity Services
export const activityService = {
  getMyActivities: async () => {
    const response = await apiClient.get('/api/activities/my-activities');
    return response.data;
  },

  getMyTaskActivities: async (taskId) => {
    const response = await apiClient.get(`/api/activities/my-task-activities/${taskId}`);
    return response.data;
  },

  getTeamActivityFeed: async (teamId) => {
    const response = await apiClient.get(`/api/activities/team-feed/${teamId}`);
    return response.data;
  },

  createActivity: async (taskId, data) => {
    const formData = new FormData();
    formData.append('Description', data.description);
    
    if (data.imageFile) {
      formData.append('ImageFile', data.imageFile);
    }

    const response = await apiClient.post(`/api/tasks/${taskId}/activities`, formData);
    return response.data;
  },
};

// Comment Services
export const commentService = {
  addComment: async (activityId, data) => {
    await apiClient.post(`/api/comments/activity/${activityId}`, data);
  },

  addReply: async (commentId, data) => {
    await apiClient.post(`/api/comments/${commentId}/reply`, data);
  },
};

// Team Services
export const teamService = {
  getMyTeams: async () => {
    const response = await apiClient.get('/api/teams/my-teams');
    return response.data;
  },

  createTeam: async (data) => {
    const response = await apiClient.post('/api/teams', data);
    return response.data;
  },

  getTeamMembers: async (teamId) => {
    const response = await apiClient.get(`/api/teams/${teamId}/members`);
    return response.data;
  },

  inviteUser: async (teamId, data) => {
    await apiClient.post(`/api/teams/${teamId}/invite`, data);
  },

  getTeamInvitations: async () => {
    const response = await apiClient.get('/api/teams/invitations');
    return response.data;
  },

  acceptInvitation: async (invitationId) => {
    await apiClient.post(`/api/teams/invitations/${invitationId}/accept`);
  },

  declineInvitation: async (invitationId) => {
    await apiClient.post(`/api/teams/invitations/${invitationId}/decline`);
  },
};

// Notification Services
export const notificationService = {
  getNotifications: async () => {
    const response = await apiClient.get('/api/notifications');
    return response.data;
  },

  markAllAsRead: async () => {
    await apiClient.post('/api/notifications/mark-as-read');
  },

  // Yeni Fonksiyon
   markOneAsRead: async (notificationId) => {
    const response = await apiClient.post(`/api/notifications/${notificationId}/mark-as-read`);
    return response.data; // { link: "/path/to/go" } dönecek
  },

  sendMeetingInvitation: async (data) => {
    await apiClient.post('/api/notifications/send-meeting-invitation', data);
  },
};

// Dashboard Service
export const dashboardService = {
  getTeamStats: async (teamId) => {
    const response = await apiClient.get(`/api/Dashboard/stats?teamId=${teamId}`);
    return response.data;
  },
};

// AI Service
export const aiService = {
  getCalendarSummary: async (tasks) => {
    const response = await apiClient.post('/api/AI/calendar-summary', tasks);
    return response.data;
  },

  askAssistant: async ({ question, teamId }) => {
    // DOĞRU URL: /api/AiAssistant/ask
    const response = await apiClient.post('/api/AiAssistant/ask', {
      question,
      teamId,
    });
    return response.data;
  },
};