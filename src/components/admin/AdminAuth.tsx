import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase';
import {
  Shield,
  Lock,
  Mail,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface AdminAuthProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onSuccess, onCancel }) => {
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('mradityapathak53@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Firebase Email/Password Sign-In Handler
  const handleFirebaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your administrator email.');
      return;
    }

    if (isResetPassword) {
      setLoading(true);
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMessage('Password reset link sent to your email address.');
      } catch (err: any) {
        setErrorMessage(getFriendlyErrorMessage(err.code || err.message));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(getFriendlyErrorMessage(err.code || err.message));
    } finally {
      setLoading(false);
    }
  };

  const getFriendlyErrorMessage = (code: string) => {
    if (code.includes('operation-not-allowed')) {
      return 'Email/Password sign-in is not enabled in your Firebase Console yet. Please open your Firebase Console (learningportal-32ef9) > Authentication > Sign-in method, click Email/Password, and toggle Enable to ON.';
    }
    if (code.includes('user-not-found')) {
      return 'No administrator account found with this email. Admin accounts are managed directly via Firebase Console > Authentication > Users.';
    }
    if (code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Invalid email or password. Please verify your credentials.';
    }
    if (code.includes('too-many-requests')) {
      return 'Access temporarily disabled due to multiple failed login attempts. Please reset your password or try again later.';
    }
    if (code.includes('network-request-failed')) {
      return 'Network connection error. Please check your internet connection.';
    }
    return code || 'Authentication failed. Please check your email and password.';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5f90eb] via-[#9147f1] to-[#ce03f6] text-white p-6 text-center relative">
          <button
            onClick={onCancel}
            className="absolute left-4 top-4 text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Return to Student Portal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-white/20 backdrop-blur-xs rounded-2xl border border-white/30 flex items-center justify-center mx-auto mb-2.5 shadow-inner">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white drop-shadow-xs">
            Faculty & Admin Portal Login
          </h2>
          <p className="text-white/85 text-xs mt-1 font-medium">
            Karamraji Institute of Computer Science & IT
          </p>

          <div className="mt-3 text-[11px] text-white font-mono flex items-center justify-center gap-1.5 bg-black/20 py-1 px-3 rounded-full mx-auto w-fit border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span>Firebase Auth • learningportal-32ef9</span>
          </div>
        </div>

        {/* Content Container */}
        <div className="p-6 sm:p-8">
          {/* Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleFirebaseSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mradityapathak53@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1565c0]/30 focus:border-[#1565c0] transition-colors"
                />
              </div>
            </div>

            {!isResetPassword && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPassword(true);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1565c0]/30 focus:border-[#1565c0] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#1565c0] hover:bg-[#0d47a1] text-white font-bold text-sm rounded-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : isResetPassword ? (
                <span>Send Password Reset Email</span>
              ) : (
                <span>Sign In with Firebase Auth</span>
              )}
            </button>

            {isResetPassword && (
              <div className="text-center text-xs text-slate-500 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPassword(false);
                    setErrorMessage(null);
                  }}
                  className="text-blue-600 font-semibold underline cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Console Managed Notice */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-xs flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Admin credentials are authenticated via your Firebase project console.</span>
            </div>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Return to Student Portal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
