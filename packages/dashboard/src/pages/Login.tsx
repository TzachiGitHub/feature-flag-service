import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import Spinner from '../components/Spinner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/flags');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <motion.div
        className="card p-8 w-full max-w-md backdrop-blur-xl bg-slate-800/80 border border-slate-700/50 shadow-modal"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="text-center mb-8">
          <motion.span
            className="text-4xl inline-block"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            role="img"
            aria-label="Flag"
          >
            🚩
          </motion.span>
          <h1 className="text-2xl font-bold text-white mt-2">Sign in to FlagService</h1>
          <p className="text-slate-400 mt-1">Manage your feature flags</p>
        </div>

        {error && (
          <motion.div
            className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-md mb-4 text-sm"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-label="Email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              aria-label="Password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            aria-label="Sign in"
          >
            {loading && <Spinner size="sm" />}
            Sign In
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link to="/register" className="text-indigo-400 hover:text-indigo-300 transition-colors">Create one</Link>
        </p>
      </motion.div>
    </div>
  );
}
