import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Code2,
  ShieldCheck,
  FileText,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { loginStudent } from '../../services/portalService';
import { Student } from '../../types';
import { Footer } from '../Footer';
import { useInstitute } from '../../context/InstituteContext';

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
  const { settings } = useInstitute();
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600/20 selection:text-blue-900 relative overflow-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-blue-100/40 via-purple-50/30 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-12 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-24 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Institute Header */}
      <header className="w-full bg-gradient-to-r from-[#5f90eb] via-[#9147f1] to-[#ce03f6] text-white shadow-md select-none sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-3">
          {/* Logo & Institute Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 sm:h-12 w-10 sm:w-12 rounded-xl bg-white p-1 shadow-sm border border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src={settings.logoUrl || '/images/logo.jpg'}
                alt={`${settings.shortName} Logo`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/logo.jpg';
                }}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-white leading-tight drop-shadow-xs truncate">
                {settings.instituteName}
              </h1>
              <span className="text-emerald-200 text-[10px] sm:text-xs font-semibold tracking-wide flex items-center gap-1 mt-0.5 truncate">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-300 inline shrink-0" />
                <span className="truncate">{settings.affiliationText || `${settings.shortName} Learning Portal`}</span>
              </span>
            </div>
          </div>

          {/* Faculty / Admin Login Shortcut */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="header-admin-login-btn"
              type="button"
              onClick={onOpenAdminAuth}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-sm transition-all border border-white/25 text-white flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Faculty / Admin Portal</span>
              <span className="sm:hidden">Faculty</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split Layout: Left Hero Section, Right Login Card */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 items-center">
          
          {/* ======================================================== */}
          {/* LEFT SIDE: ATTRACTIVE HERO SECTION                       */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            
            {/* Top Eyebrow Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold w-fit shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              <span>{settings.affiliationText || 'NIELIT O-Level Authorized Learning Centre'}</span>
            </div>

            {/* Inspiring Headline */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight sm:leading-none">
                Master Next-Gen Tech Skills with{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  {settings.shortName} Digital Portal
                </span>
              </h2>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
                Welcome to the official student portal of <strong>{settings.instituteName}</strong>. 
                Log in to access your complete curriculum notes, interactive code playgrounds, 
                step-by-step practical guides, and examination revision materials curated by your faculty.
              </p>
            </div>

            {/* Key Academic Pillars (4 Micro Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Verified Syllabus Notes</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Chapter-by-chapter theory, diagrams, and examination focus topics.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0 text-purple-600 mt-0.5">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Practical Code & Labs</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Clean, syntax-highlighted code for HTML/CSS, JS, and Python modules.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 text-emerald-600 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Single Active Device</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Protected student roll number credentials with anti-sharing security.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 text-amber-600 mt-0.5">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">24/7 Digital Desk</h4>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Revisit lectures, solved practicals, and syllabus revisions anytime.
                  </p>
                </div>
              </div>
            </div>


            {/* Campus Support Info Bar (if configured) */}
            {(settings.contactPhone || settings.contactEmail || settings.address) && (
              <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                {settings.contactPhone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Helpdesk: <strong className="text-slate-700 font-semibold">{settings.contactPhone}</strong></span>
                  </div>
                )}
                {settings.contactEmail && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                    <span className="truncate">{settings.contactEmail}</span>
                  </div>
                )}
                {settings.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate max-w-xs">{settings.address}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* RIGHT SIDE: ATTRACTIVE LOGIN FORM CARD                   */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-200/90 overflow-hidden relative transition-all">
              
              {/* Colorful Card Accent Strip */}
              <div className="h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />

              <div className="p-6 sm:p-8">
                {/* Form Header */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 p-2 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <img
                      src={settings.logoUrl || '/images/logo.jpg'}
                      alt={`${settings.shortName} Logo`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/logo.jpg';
                      }}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Student Login
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sign in with your assigned Roll Number and Password
                  </p>
                </div>

                {/* Error Alert */}
                {errorMessage && (
                  <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 leading-relaxed shadow-xs animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <strong className="font-semibold block">Authentication Notice</strong>
                      <span>{errorMessage}</span>
                    </div>
                  </div>
                )}

                {/* Student Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Student ID / Roll Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Student ID / Roll Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="student-id-input"
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder={`e.g. ${settings.shortName}-101 or Roll No`}
                        required
                        autoFocus
                        className="w-full pl-10 pr-4 h-12 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password Field with Eye Toggle */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400">Case-sensitive</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="student-password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your student password"
                        required
                        className="w-full pl-10 pr-12 h-12 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-lg hover:bg-slate-100 transition-colors"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit CTA */}
                  <button
                    id="student-signin-btn"
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.98]"
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

                {/* Security and Enrollment Note */}
                <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      <strong>Single Active Session:</strong> Only 1 device active at a time.
                    </span>
                  </div>

                  {/* Faculty Login Link */}
                  <div className="text-center pt-1">
                    <p className="text-xs text-slate-500">
                      Institute Instructor or Administrator?{' '}
                      <button
                        type="button"
                        onClick={onOpenAdminAuth}
                        className="text-blue-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Faculty Portal</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick Assistance pill under card */}
            <p className="text-[11px] text-slate-500 mt-4 text-center">
              Don't have your Roll Number or Password?{' '}
              <span className="font-semibold text-slate-700">Contact Institute Office</span>
            </p>
          </div>

        </div>
      </main>

      {/* Standard Footer */}
      <Footer onAdminClick={onOpenAdminAuth} />
    </div>
  );
};
