import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import './App.css';
import ProtectedRoute from './routes/ProtectedRoute';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import CalendarPage from './pages/CalendarPage';
import Dashboard from './pages/Dashboard';
import MyTasks from './pages/MyTasks';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import AdminTasksTable from './pages/AdminTasksTable';
import AdminReports from './pages/AdminReports';
import Teams from './pages/Teams';
import MyTaskActivities from './pages/MyTaskActivities';
import TeamTaskFeed from './pages/TeamTaskFeed';
import MyActivities from './pages/MyActivities';
import TeamActivities from './pages/TeamActivities';
import TeamTasksBoard from './pages/TeamTasksBoard';
// --- EKSİK OLAN IMPORT BURAYA EKLENDİ ---
import MeetingPage from './pages/MeetingPage'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* User Alanı */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CalendarPage />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="my-tasks" element={<MyTasks />} />
          <Route path="team-tasks" element={<TeamTasksBoard />} />
          <Route path="activities/my" element={<MyActivities />} />
          <Route path="team-activities" element={<TeamActivities />} />
          <Route path="tasks/:taskId/my-activities" element={<MyTaskActivities />} />
          <Route path="tasks/:taskId/feed" element={<TeamTaskFeed />} />
          <Route path="teams" element={<Teams />} />
          <Route path="settings" element={<Settings />} />
          <Route path="meeting/:roomName" element={<MeetingPage />} />
        </Route>

        {/* Admin Alanı */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="tasks" element={<AdminTasksTable />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<Settings />} />
          {/* Admin paneline de toplantı oluşturma eklenebilir, şimdilik duruyor */}
          {/* <Route path="meetings/new" element={<CreateMeetingPage />} /> */}
        </Route>

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
export default App;