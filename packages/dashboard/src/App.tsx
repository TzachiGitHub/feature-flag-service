import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
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
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/flags" replace />} />
        <Route path="flags" element={<FlagList />} />
        <Route path="flags/:flagKey" element={<FlagDetail />} />
        <Route path="segments" element={<Segments />} />
        <Route path="segments/:segmentKey" element={<SegmentDetail />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="audit-log" element={<AuditLog />} />
        <Route path="settings" element={<Settings />} />
        <Route path="playground" element={<Playground />} />
        <Route path="learn" element={<Learn />} />
      </Route>
    </Routes>
  );
}
