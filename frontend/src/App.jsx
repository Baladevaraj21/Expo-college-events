import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentApplications from './pages/StudentApplications';
import CollegeDashboard from './pages/CollegeDashboard';
import CollegeProfile from './pages/CollegeProfile';

const PrivateRoute = ({ children, roles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'college' ? '/college-dashboard' : '/student-dashboard'} replace />;
  }

  return children;
};

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [notifEvent, setNotifEvent] = useState(null);

  return (
    <>
      {isAuthenticated && (
        <Header
          onSearch={setSearchQuery}
          onFilterToggle={() => setShowFilter(!showFilter)}
          onSelectNotifEvent={setNotifEvent}
        />
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user.role === 'college' ? '/college-dashboard' : '/student-dashboard'} replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={user.role === 'college' ? '/college-dashboard' : '/student-dashboard'} replace />} />

        <Route path="/student-dashboard" element={<PrivateRoute roles={['student']}><StudentDashboard searchQuery={searchQuery} showFilter={showFilter} notifEvent={notifEvent} clearNotifEvent={() => setNotifEvent(null)} /></PrivateRoute>} />
        <Route path="/student-profile" element={<PrivateRoute roles={['student']}><StudentProfile /></PrivateRoute>} />
        <Route path="/student-applications" element={<PrivateRoute roles={['student']}><StudentApplications /></PrivateRoute>} />

        <Route path="/college-dashboard" element={<PrivateRoute roles={['college']}><CollegeDashboard /></PrivateRoute>} />
        <Route path="/college-profile" element={<PrivateRoute roles={['college']}><CollegeProfile /></PrivateRoute>} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
