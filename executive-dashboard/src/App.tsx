import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import IncomingCall from './pages/IncomingCall';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';

// --- SECURITY GATEKEEPER: Protected Route Wrapper ---
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem('sp_auth') === 'true';
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* All Executive Routes are Protected */}
        <Route path="/" element={
          <ProtectedRoute>
            <LandingPage />
          </ProtectedRoute>
        } />
        <Route path="/incoming" element={
          <ProtectedRoute>
            <IncomingCall />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
