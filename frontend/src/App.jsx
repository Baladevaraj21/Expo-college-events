import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentApplications from './pages/StudentApplications';
import CollegeDashboard from './pages/CollegeDashboard';
import CollegeProfile from './pages/CollegeProfile';
import StudentProfileView from './pages/StudentProfileView';
import EventHistory from './pages/EventHistory';
import FollowPage from './pages/FollowPage';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [notifEvent, setNotifEvent] = useState(null);

  return (
    <>
      {isAuthenticated && (
        <Header
          onSearch={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onSelectNotifEvent={setNotifEvent}
        />
      )}

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user.role === 'college' ? '/college-dashboard' : '/student-dashboard'} replace />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={user.role === 'college' ? '/college-dashboard' : '/student-dashboard'} replace />} />

        <Route path="/student-dashboard" element={<PrivateRoute roles={['student']}><StudentDashboard searchQuery={searchQuery} selectedCategory={selectedCategory} notifEvent={notifEvent} clearNotifEvent={() => setNotifEvent(null)} /></PrivateRoute>} />
        <Route path="/student-profile" element={<PrivateRoute roles={['student']}><StudentProfile /></PrivateRoute>} />
        <Route path="/student/:id" element={<PrivateRoute roles={['college', 'student']}><StudentProfileView /></PrivateRoute>} />
        <Route path="/student-applications" element={<PrivateRoute roles={['student']}><StudentApplications /></PrivateRoute>} />

        <Route path="/college-dashboard" element={<PrivateRoute roles={['college']}><CollegeDashboard searchQuery={searchQuery} /></PrivateRoute>} />
        <Route path="/college-profile" element={<PrivateRoute roles={['college']}><CollegeProfile /></PrivateRoute>} />
        <Route path="/college/:id" element={<PrivateRoute roles={['college', 'student']}><CollegeProfile /></PrivateRoute>} />

        <Route path="/follow" element={<PrivateRoute roles={['college', 'student']}><FollowPage /></PrivateRoute>} />

        <Route path="/history" element={<PrivateRoute roles={['college', 'student']}><EventHistory /></PrivateRoute>} />
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
