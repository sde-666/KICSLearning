import React, { useState, useMemo } from 'react';
import { Course, StudentSession } from '../types';
import { useInstitute } from '../context/InstituteContext';
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  Search,
  Lock,
  Compass,
  X,
  FileText,
  CheckCircle2,
} from 'lucide-react';

interface CourseListProps {
  courses: Course[];
  studentSession?: StudentSession | null;
  totalInstituteCourses?: number;
  onSelectCourse: (courseId: number) => void;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  studentSession,
  totalInstituteCourses = courses.length,
  onSelectCourse,
}) => {
  const { settings } = useInstitute();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const isFullAccess =
    !studentSession ||
    studentSession.course_ids?.includes('all') ||
    studentSession.course_id === 'all';

  // Course theme color accents based on index or title
  const getCourseTheme = (courseId: number, index: number) => {
    const themes = [
      {
        accent: 'from-blue-600 to-indigo-600',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        borderHover: 'hover:border-blue-500',
        iconBg: 'bg-blue-600 text-white',
        btnBg: 'bg-blue-600 hover:bg-blue-700',
        tag: 'M1 • Core IT',
      },
      {
        accent: 'from-purple-600 to-pink-600',
        badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
        borderHover: 'hover:border-purple-500',
        iconBg: 'bg-purple-600 text-white',
        btnBg: 'bg-purple-600 hover:bg-purple-700',
        tag: 'M2 • Web & Publishing',
      },
      {
        accent: 'from-emerald-600 to-teal-600',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        borderHover: 'hover:border-emerald-500',
        iconBg: 'bg-emerald-600 text-white',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700',
        tag: 'M3 • Python & Coding',
      },
      {
        accent: 'from-amber-500 to-orange-600',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        borderHover: 'hover:border-amber-500',
        iconBg: 'bg-amber-600 text-white',
        btnBg: 'bg-amber-600 hover:bg-amber-700',
        tag: 'M4 • IoT & Systems',
      },
    ];
    return themes[index % themes.length];
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      if (!c.is_visible) return false;

      // Category filter
      if (selectedCategory !== 'all') {
        const text = (c.title + ' ' + (c.description || '')).toLowerCase();
        if (selectedCategory === 'python' && !text.includes('python')) return false;
        if (selectedCategory === 'web' && !text.includes('web') && !text.includes('design')) return false;
        if (selectedCategory === 'iot' && !text.includes('iot') && !text.includes('internet of things')) return false;
        if (selectedCategory === 'it' && !text.includes('it') && !text.includes('tool')) return false;
      }

      // Search term filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        c.title.toLowerCase().includes(term) ||
        (c.description && c.description.toLowerCase().includes(term))
      );
    });
  }, [courses, searchTerm, selectedCategory]);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Announcement Ribbon if configured */}
      {settings.heroNotice && (
        <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
          <span className="truncate">{settings.heroNotice}</span>
        </div>
      )}

      {/* Minimal Header & Search Bar directly introducing assigned courses */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-blue-600" />
            <span>{isFullAccess ? 'Curriculum Modules' : 'My Assigned Courses'}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'Module' : 'Modules'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {studentSession
              ? `Assigned learning modules for ${studentSession.name} (${studentSession.studentId}). Click any module to access notes and labs.`
              : 'Select a module to browse unit chapters, rich-text lecture notes, and downloadable code.'}
          </p>
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="course-search-input"
            type="text"
            placeholder="Search Python, Web, IoT, IT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Modules ({courses.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('web')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'web'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Web Designing (M2)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('python')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'python'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Python Programming (M3)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('iot')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'iot'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Internet of Things (M4)
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('it')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'it'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            IT Tools &amp; Basics (M1)
          </button>
        </div>

        {/* When no courses are assigned to this student */}
        {courses.length === 0 && (
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-amber-200 p-8 text-center shadow-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Modules Assigned Yet</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Hello <strong className="text-slate-800">{studentSession?.name || 'Student'}</strong> (Roll: {studentSession?.studentId}). Your account is active, but institute faculty has not yet assigned any specific course modules to your profile.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-600 mb-2">
              Please contact <strong>{settings.instituteName}</strong> faculty with your Student ID <strong>{studentSession?.studentId}</strong> to unlock your courses.
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* COURSE CARDS GRID                                         */}
        {/* ========================================================= */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map((course, idx) => {
              const theme = getCourseTheme(course.id, idx);

              return (
                <div
                  key={course.id}
                  id={`course-card-${course.id}`}
                  className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group relative overflow-hidden ${theme.borderHover}`}
                >
                  {/* Top Colorful Accent Strip */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${theme.accent}`}
                  />

                  <div>
                    {/* Top Row: Module Badge & Tag */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badgeBg}`}>
                        Module #{course.id}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        {theme.tag}
                      </span>
                    </div>

                    {/* Course Title */}
                    <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                      {course.title}
                    </h3>

                    {/* Course Description */}
                    <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed mb-4">
                      {course.description ||
                        'Master syllabus concepts with structured chapter lectures, exam-oriented notes, and interactive examples.'}
                    </p>
                  </div>

                  {/* Bottom Footer & Action */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-blue-500" />
                        <span>Syllabus Units</span>
                      </span>
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </span>
                    </div>

                    <button
                      id={`course-start-btn-${course.id}`}
                      onClick={() => onSelectCourse(course.id)}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs text-white shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${theme.btnBg}`}
                    >
                      <span>Explore Module</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Search empty state */}
        {courses.length > 0 && filteredCourses.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-500 shadow-sm max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">No Courses Found</h4>
            <p className="text-xs text-slate-500 mb-4">
              We couldn't find any courses matching "{searchTerm}". Try checking for Python, Web, or IoT.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Clear Search &amp; Filters
            </button>
          </div>
        )}
    </div>
  );
};
