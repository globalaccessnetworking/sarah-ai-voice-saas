import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegistryPage from './pages/RegistryPage';

// ── Security Gatekeeper ────────────────────────────────────────────────────────
// Uses 'sp_cr_auth' (complaint-registry) to avoid conflicting with
// the executive-dashboard's 'sp_auth' key if both run on the same browser.
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuth = localStorage.getItem('sp_cr_auth') === 'true';
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RegistryPage />
            </ProtectedRoute>
          }
        />
        {/* Catch-all → redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
