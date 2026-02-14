import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import FlagList from './pages/FlagList';
import FlagDetail from './pages/FlagDetail';
import Segments from './pages/Segments';
import SegmentDetail from './pages/SegmentDetail';
import Analytics from './pages/Analytics';
import AuditLog from './pages/AuditLog';
import Settings from './pages/Settings';
import Playground from './pages/Playground';
import Learn from './pages/Learn';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  useEffect(() => { loadFromStorage(); }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/flags" replace />} />
          <Route path="flags" element={<ErrorBoundary><FlagList /></ErrorBoundary>} />
          <Route path="flags/:flagKey" element={<ErrorBoundary><FlagDetail /></ErrorBoundary>} />
          <Route path="segments" element={<ErrorBoundary><Segments /></ErrorBoundary>} />
          <Route path="segments/:segmentKey" element={<ErrorBoundary><SegmentDetail /></ErrorBoundary>} />
          <Route path="analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
          <Route path="audit-log" element={<ErrorBoundary><AuditLog /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
          <Route path="playground" element={<ErrorBoundary><Playground /></ErrorBoundary>} />
          <Route path="learn" element={<ErrorBoundary><Learn /></ErrorBoundary>} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
