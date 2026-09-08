import React, { useState } from 'react';
import { Course, StudentSession } from '../types';
import { BookOpen, ArrowRight, Sparkles, Search, ShieldCheck, Lock } from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  studentSession?: StudentSession | null;
  totalInstituteCourses?: number;
  onSelectCourse: (courseId: number) => void;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  studentSession,
  totalInstituteCourses,
  onSelectCourse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCourses = courses.filter((c) => {
    // Hide courses where is_visible is false
    if (!c.is_visible) return false;
    if (!searchTerm.trim()) return true;
    return (
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const isFullAccess =
    !studentSession ||
    studentSession.course_ids?.includes('all') ||
    studentSession.course_id === 'all';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0d47a1] tracking-tight mb-2 flex items-center justify-center gap-2">
          <span>📚 {isFullAccess ? 'Available Curriculum' : 'My Enrolled Courses'}</span>
        </h2>
        <p className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto">
          Comprehensive curriculum notes, chapter units, and interactive lectures curated for NIELIT O-Level and IT certifications.
        </p>

        {/* Access Status Banner for Student */}
        {studentSession && (
          <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium shadow-2xs">
            {isFullAccess ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Full Curriculum Access Granted ({courses.length} Modules Available)</span>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>
                  Showing {courses.length} course{courses.length === 1 ? '' : 's'} assigned to your account ({studentSession.studentId})
                </span>
              </>
            )}
          </div>
        )}

        {/* Search Bar (only if there are courses to search) */}
        {courses.length > 0 && (
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="course-search-input"
              type="text"
              placeholder="Search courses (e.g. Python, Web, IoT, IT Tools)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-full shadow-xs text-sm focus:outline-hidden focus:ring-2 focus:ring-[#5f90eb] focus:border-transparent transition-all"
            />
          </div>
        )}
      </div>

      {/* When no courses are assigned to this student */}
      {courses.length === 0 && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-amber-200 p-8 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Courses Assigned</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4">
            Hello <strong className="text-slate-800">{studentSession?.name || 'Student'}</strong> ({studentSession?.studentId}). Your account is active, but institute faculty has not yet assigned any specific course modules to your profile.
          </p>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 mb-2">
            Please contact your institute teacher or administrator with your Roll Number <strong>{studentSession?.studentId}</strong> to grant course access.
          </div>
        </div>
      )}

      {/* Course Grid */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCourses.map((course) => {
            return (
              <div
                key={course.id}
                id={`course-card-${course.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-xl border-t-[5px] border-t-[#1565c0] border-x border-b border-slate-200/80 p-5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="p-2 rounded-lg bg-blue-50 text-[#1565c0] group-hover:bg-[#1565c0] group-hover:text-white transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      Module #{course.id}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1a237e] mb-2 leading-snug group-hover:text-[#1565c0] transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed mb-4">
                    {course.description || 'Master this module with detailed lecture notes, practice exercises, and study guides.'}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <button
                    id={`course-start-btn-${course.id}`}
                    onClick={() => onSelectCourse(course.id)}
                    className="w-full bg-[#1e88e5] hover:bg-[#0d47a1] text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-xs hover:shadow-sm cursor-pointer"
                  >
                    <span>Start Course</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {courses.length > 0 && filteredCourses.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <Sparkles className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-base font-medium">No courses found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
