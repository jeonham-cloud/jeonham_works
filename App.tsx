import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { RequestProvider } from './contexts/RequestContext';
import { ScheduleProvider } from './contexts/ScheduleContext';
import { TaskRequest } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RequestList from './pages/RequestList';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Schedules from './pages/Schedules';
import LunchCalendar from './pages/LunchCalendar';
import SystemLogs from './pages/SystemLogs';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { currentUser, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser?.role || '')) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="requests" element={<RequestList />} />
        <Route path="requests/:id" element={<RequestDetail />} />
        <Route path="create" element={<CreateRequest />} />
        <Route path="schedules" element={<Schedules />} />
        <Route path="lunch" element={<LunchCalendar />} />
        <Route 
          path="admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Admin />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="logs" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemLogs />
            </ProtectedRoute>
          } 
        />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

// Intermediate component to bridge NotificationProvider and RequestProvider
// NotificationProvider needs requests for deadline checking, 
// but RequestProvider needs NotificationProvider for sending notifications.
// Solution: lift requests state up via callback.
function DataProviders({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<TaskRequest[]>([]);

  return (
    <NotificationProvider requests={requests}>
      <RequestProvider onRequestsChange={setRequests}>
        <ScheduleProvider>
          {children}
        </ScheduleProvider>
      </RequestProvider>
    </NotificationProvider>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <DataProviders>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProviders>
      </AuthProvider>
    </SettingsProvider>
  );
}
