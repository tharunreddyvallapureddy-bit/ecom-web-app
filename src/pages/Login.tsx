import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Shield, User, Truck } from 'lucide-react';

const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const user = await loginWithGoogle();
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'customer' | 'delivery_partner') => {
    setError('');
    setLoading(true);
    let quickEmail = '';
    let quickPassword = '';

    if (role === 'admin') {
      quickEmail = 'admin@restaurant.com';
      quickPassword = 'admin123';
    } else if (role === 'customer') {
      quickEmail = 'customer@user.com';
      quickPassword = 'user123';
    } else if (role === 'delivery_partner') {
      quickEmail = 'rider@delivery.com';
      quickPassword = 'rider123';
    }

    try {
      const user = await login(quickEmail, quickPassword);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (role: 'customer' | 'admin' | 'delivery_partner') => {
    if (role === 'admin') {
      navigate('/admin');
    } else if (role === 'delivery_partner') {
      navigate('/delivery');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12 bg-slate-950">
      <div className="w-full max-w-md glass p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-orange-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-black bg-gradient-to-r from-orange-400 to-amber-400 text-transparent bg-clip-text">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-xs mt-1.5">Sign in to Gourmet Express or use a mock account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm rounded-lg transition shadow-lg shadow-orange-500/10 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <span className="relative px-3 bg-slate-950 text-[10px] uppercase font-bold text-slate-500">Or continue with</span>
        </div>

        {/* Google sign-in */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.137 4.114-3.707 0-6.712-3.005-6.712-6.712s3.005-6.712 6.712-6.712c1.666 0 3.178.61 4.35 1.628l3.085-3.085C19.482 1.83 16.096 1 12.24 1c-6.075 0-11 4.925-11 11s4.925 11 11 11c6.333 0 11.5-4.568 11.5-11 0-.672-.061-1.32-.175-1.928H12.24Z"
            />
          </svg>
          <span>Sign In with Google</span>
        </button>

        {/* Demo Fast Logins Section */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-[10px] uppercase font-bold text-center tracking-wider text-slate-500 mb-3">
            Sandbox Demo Quick Logins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('customer')}
              className="py-1.5 px-2 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-900/60 rounded text-[11px] font-semibold text-blue-400 flex flex-col items-center space-y-1 transition cursor-pointer"
            >
              <User size={14} />
              <span>Customer</span>
            </button>
            
            <button
              onClick={() => handleQuickLogin('delivery_partner')}
              className="py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-900/60 rounded text-[11px] font-semibold text-emerald-400 flex flex-col items-center space-y-1 transition cursor-pointer"
            >
              <Truck size={14} />
              <span>Rider</span>
            </button>

            <button
              onClick={() => handleQuickLogin('admin')}
              className="py-1.5 px-2 bg-orange-950/40 hover:bg-orange-900/40 border border-orange-900/60 rounded text-[11px] font-semibold text-orange-400 flex flex-col items-center space-y-1 transition cursor-pointer"
            >
              <Shield size={14} />
              <span>Admin</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          New customer?{' '}
          <Link to="/register" className="text-orange-500 hover:text-orange-400 font-bold transition">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
