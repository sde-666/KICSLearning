import React from 'react';
import { BookOpen, GraduationCap, ShieldCheck, User, LogOut } from 'lucide-react';
import { StudentSession } from '../types';

interface NavbarProps {
  onHomeClick: () => void;
  isAdminLoggedIn?: boolean;
  onOpenAdmin?: () => void;
  studentSession?: StudentSession | null;
  onStudentLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onHomeClick,
  isAdminLoggedIn = false,
  onOpenAdmin,
  studentSession,
  onStudentLogout,
}) => {
  return (
    <header className="w-full bg-gradient-to-r from-[#5f90eb] via-[#9147f1] to-[#ce03f6] text-white shadow-md select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Institute Identity */}
        <div
          id="navbar-brand"
          onClick={onHomeClick}
          className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group transition-transform active:scale-95 min-w-0"
        >
          <img
            src="/images/logo.jpg"
            alt="KICST Logo"
            className="h-10 sm:h-14 md:h-16 w-auto rounded-lg shadow-sm border border-white/30 object-contain bg-white transition-all shrink-0 group-hover:scale-105"
          />
          <div className="min-w-0">
            <h1 className="text-xs sm:text-base md:text-xl font-bold tracking-tight text-white leading-tight drop-shadow-sm truncate">
              Karamraji Institute of Computer Science & IT
            </h1>
            <span
              id="e"
              className="text-emerald-200 text-[10px] sm:text-xs font-semibold tracking-wide flex items-center gap-1 mt-0.5"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-300 inline shrink-0" />
              <span>Karamraji Learning Portal &bull; NIELIT O-Level</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap shrink-0">
          <button
            id="nav-home-btn"
            onClick={onHomeClick}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-white/15 hover:bg-white/25 backdrop-blur-sm transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">My Courses</span>
          </button>

          {/* Student Profile & Course Access Badge */}
          {studentSession && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="px-2.5 py-1 rounded-full text-xs bg-white/20 backdrop-blur-sm border border-white/30 text-white flex items-center gap-1.5 font-medium max-w-[150px] sm:max-w-none">
                <User className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span className="font-semibold truncate">{studentSession.name}</span>
                <span className="text-[10px] opacity-80 font-mono hidden md:inline">({studentSession.studentId})</span>
                {studentSession.course_ids && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] bg-emerald-500/30 text-emerald-100 border border-emerald-400/30 font-semibold hidden sm:inline">
                    {studentSession.course_ids.includes('all') || studentSession.course_id === 'all'
                      ? 'Full'
                      : `${studentSession.course_ids.length} Enrolled`}
                  </span>
                )}
              </div>

              {onStudentLogout && (
                <button
                  type="button"
                  onClick={onStudentLogout}
                  title="Sign out of student portal"
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold bg-red-600/85 hover:bg-red-600 text-white border border-red-400/40 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Log Out</span>
                </button>
              )}
            </div>
          )}

          {/* Admin Dashboard button if faculty is logged in */}
          {isAdminLoggedIn && onOpenAdmin && (
            <button
              id="admin-active-btn"
              onClick={onOpenAdmin}
              title="Return to Admin Panel"
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

