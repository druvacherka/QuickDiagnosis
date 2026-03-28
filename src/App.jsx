import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import axios from 'axios';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Symptoms from './pages/Symptoms';
import Results from './pages/Results';
import Hospitals from './pages/Hospitals';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';

// Simple protected route wrapper
const ProtectedRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const AppContent = () => {
  const { addNotification } = useNotifications();
  const user = JSON.parse(localStorage.getItem('user'));

  React.useEffect(() => {
    if (!user) return;

    // Daily Health Tip Logic
    const lastTipDate = localStorage.getItem(`last_health_tip_date_${user._id}`);
    const today = new Date().toDateString();

    if (lastTipDate !== today) {
      axios.get('http://localhost:5000/api/health-tips')
        .then(res => {
          addNotification({
            type: 'health_tip',
            title: 'Daily Health Tip',
            message: res.data.tip
          });
          localStorage.setItem(`last_health_tip_date_${user._id}`, today);
        })
        .catch(err => console.error("Failed to fetch health tip:", err));
    }
  }, [user?.id]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/symptoms" element={<Symptoms />} />
        <Route path="/results" element={<Results />} />
        <Route path="/hospitals" element={<Hospitals />} />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;
