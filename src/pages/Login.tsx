import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Phone, KeyRound, User, ShieldAlert } from 'lucide-react';
import { isMockMode } from '../services/firebase';

const Login: React.FC = () => {
  const { login, loginWithGoogle, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'customer' | 'staff'>('customer');

  // Customer phone variables
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmResult, setConfirmResult] = useState<any>(null);

  // Staff login variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Universal state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle staff form submission
  const handleStaffSubmit = async (e: React.FormEvent) => {
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

  // Google sign in (as customer fallback)
  const handleGoogleSignIn = async () => {
    setError('');
    try {
      const user = await loginWithGoogle();
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Google Authentication failed.');
    }
  };

  // Send OTP trigger
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Normalize phone number (ensure country code +91 is added if missing)
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      if (formattedPhone.startsWith('91') && formattedPhone.length > 10) {
        formattedPhone = '+' + formattedPhone;
      } else {
        formattedPhone = '+91' + formattedPhone;
      }
    }

    setLoading(true);
    try {
      const result = await sendOtp(formattedPhone, 'recaptcha-container');
      setConfirmResult(result);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP trigger
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone;
    }

    try {
      const user = await verifyOtp(confirmResult, otpCode, formattedPhone);
      redirectUser(user.role);
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your OTP.');
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
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/60 rounded-xl border border-slate-800 mb-8">
          <button
            onClick={() => {
              setActiveTab('customer');
              setError('');
              setOtpSent(false);
            }}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'customer'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User size={13} />
            <span>Customer Login</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('staff');
              setError('');
            }}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-orange-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert size={13} />
            <span>Staff Portal</span>
          </button>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-black bg-gradient-to-r from-orange-400 to-amber-400 text-transparent bg-clip-text">
            {activeTab === 'customer' ? 'Customer Authentication' : 'Staff / Partner Login'}
          </h2>
          <p className="text-slate-400 text-xs mt-1.5">
            {activeTab === 'customer' 
              ? 'Verify your phone number with a secure OTP code' 
              : 'Log in to your admin console or rider hub'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {/* CUSTOMER PHONE / OTP FLOW */}
        {activeTab === 'customer' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 bg-slate-900 border border-r-0 border-slate-800 rounded-l-lg text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <div className="relative flex-grow">
                      <Phone className="absolute left-3 top-2.5 text-slate-500" size={16} />
                      <input
                        type="tel"
                        required
                        pattern="[0-9]{10}"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 10-digit number"
                        className="w-full bg-slate-900 border border-slate-800 rounded-r-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Invisible reCAPTCHA container for live Mode */}
                <div id="recaptcha-container" className="my-2"></div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm rounded-lg transition cursor-pointer"
                >
                  {loading ? 'Sending Code...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Enter Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="6-digit OTP code"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-orange-500 transition"
                    />
                  </div>
                  {isMockMode && (
                    <p className="text-[10px] text-orange-400/80 mt-1.5">
                      ⚠️ Demo mode active: Use code <strong className="font-extrabold text-white">123456</strong>
                    </p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="w-1/3 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm rounded-lg transition cursor-pointer"
                  >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                  </button>
                </div>
              </form>
            )}

            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800/80"></div>
              </div>
              <span className="relative px-3 bg-slate-950 text-[10px] uppercase font-bold text-slate-500">Or continue with</span>
            </div>

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
          </div>
        )}

        {/* STAFF EMAIL / PASSWORD FLOW */}
        {activeTab === 'staff' && (
          <form onSubmit={handleStaffSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@restaurant.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-655 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 text-slate-500" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder-slate-655 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-sm rounded-lg transition cursor-pointer"
            >
              {loading ? 'Authenticating...' : 'Sign In as Staff'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Login;
