import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Info,
} from 'lucide-react';
import { loginStudent } from '../../services/portalService';
import { Student } from '../../types';
import { Footer } from '../Footer';

interface StudentAuthProps {
  onLoginSuccess: (student: Student, sessionToken: string) => void;
  onOpenAdminAuth: () => void;
  terminationNotice?: string | null;
}

export const StudentAuth: React.FC<StudentAuthProps> = ({
  onLoginSuccess,
  onOpenAdminAuth,
  terminationNotice,
}) => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(terminationNotice || null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanId = studentId.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your Student ID or Roll Number.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your student password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginStudent(cleanId, password);
      if (res.success && res.student && res.sessionToken) {
        onLoginSuccess(res.student, res.sessionToken);
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      console.error('Student login error:', err);
      setErrorMessage(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#333] font-sans antialiased selection:bg-[#5f90eb]/20 selection:text-[#0d47a1]">
      {/* Top Institute Header (Responsive on Mobile) */}
      <header className="w-full bg-gradient-to-r from-[#5f90eb] via-[#9147f1] to-[#ce03f6] text-white shadow-md select-none">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Institute Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/images/logo.jpg"
              alt="KICST Logo"
              className="h-10 sm:h-14 md:h-16 w-auto rounded-lg shadow-sm border border-white/30 object-contain bg-white shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-base md:text-xl font-bold tracking-tight text-white leading-tight drop-shadow-xs truncate">
                Karamraji Institute of Computer Science & IT
              </h1>
              <span className="text-emerald-200 text-[10px] sm:text-xs font-semibold tracking-wide flex items-center gap-1 mt-0.5">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-300 inline shrink-0" />
                <span>NIELIT O-Level Learning Portal</span>
              </span>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              id="header-admin-login-btn"
              type="button"
              onClick={onOpenAdminAuth}
              className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors border border-white/20 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Faculty / Admin</span>
              <span className="xs:hidden">Faculty</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area - Optimized for Mobile Viewports */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3.5 sm:px-6 py-5 sm:py-10 flex flex-col items-center justify-center">
        {/* Title Header */}
        <div className="text-center max-w-xl mx-auto mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-[#1565c0] text-xs font-bold mb-2.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Karamraji Learning Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#0d47a1] tracking-tight mb-2">
            Karamraji Learning Portal
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed px-2">
            Welcome to the official student learning portal of Karamraji Institute of Computer Science &amp; IT. Sign in with your assigned Roll Number and password to access syllabus notes, unit lectures, and practical code.
          </p>
        </div>

        {/* Center Auth Card - Mobile-Optimized with 48px touch targets */}
        <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-xl border-t-4 border-t-[#1565c0] border border-slate-200/90 p-5 sm:p-8 transition-all">
          {/* Card Inner Header */}
          <div className="text-center mb-5 sm:mb-6">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-2 text-[#1565c0]">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#1a237e] tracking-tight">Student Authentication</h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Enter your credentials provided by the institute
            </p>
          </div>

          {/* Alert Message */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 leading-relaxed shadow-2xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Student ID / Roll Number *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="student-id-input"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. KICS-001 or Roll No"
                  required
                  autoFocus
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="w-full pl-10 pr-3.5 h-12 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1e88e5]/30 focus:border-[#1e88e5] transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="student-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your student password"
                  required
                  className="w-full pl-10 pr-12 h-12 text-base sm:text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1e88e5]/30 focus:border-[#1e88e5] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="student-signin-btn"
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-1 bg-gradient-to-r from-[#1e88e5] to-[#0d47a1] hover:from-[#1565c0] hover:to-[#0a3880] text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Student Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account Enrollment Notice */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-1 text-xs font-medium text-slate-600">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Accounts enrolled directly by institute faculty.</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Need password reset or access assistance? Contact your instructor.
            </p>
          </div>
        </div>

        {/* Curriculum Modules Grid - Mobile Friendly */}
        <div className="mt-6 sm:mt-8 w-full max-w-lg">
          <p className="text-center text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
            NIELIT O-Level Modules Covered:
          </p>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-left">
              <div className="text-[11px] font-bold text-blue-600 font-mono">M1-R5</div>
              <div className="text-xs font-semibold text-slate-800 truncate">IT Tools & Basics</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-left">
              <div className="text-[11px] font-bold text-purple-600 font-mono">M2-R5</div>
              <div className="text-xs font-semibold text-slate-800 truncate">Web Designing</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-left">
              <div className="text-[11px] font-bold text-emerald-600 font-mono">M3-R5</div>
              <div className="text-xs font-semibold text-slate-800 truncate">Python Programming</div>
            </div>
            <div className="px-3 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-left">
              <div className="text-[11px] font-bold text-amber-600 font-mono">M4-R5</div>
              <div className="text-xs font-semibold text-slate-800 truncate">Internet of Things</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Matching Main Page */}
      <Footer onAdminClick={onOpenAdminAuth} />
    </div>
  );
};
