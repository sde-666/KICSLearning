import React, { useState } from 'react';
import { Course, Chapter } from '../types';
import { ChevronRight, ArrowLeft, Layers, BookOpen, Search } from 'lucide-react';

interface CourseDetailProps {
  course: Course;
  chapters: Chapter[];
  onBack: () => void;
  onSelectChapter: (chapterId: number) => void;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({
  course,
  chapters,
  onBack,
  onSelectChapter,
}) => {
  const [filterText, setFilterText] = useState('');

  const visibleChapters = chapters.filter((ch) => {
    // Hide chapters with is_visible === false from public view
    if (!ch.is_visible) return false;
    if (!filterText.trim()) return true;
    return ch.title.toLowerCase().includes(filterText.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="back-to-courses-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1565c0] hover:text-[#0d47a1] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Courses</span>
        </button>
      </div>

      {/* Course Banner Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-[#5f90eb] to-[#ce03f6] rounded-xl text-white shadow-xs shrink-0">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-[#5f90eb] bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block">
              Course Curriculum
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {course.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {course.description ||
                'Explore the units below to browse lecture notes, conceptual guides, and downloadable resource materials.'}
            </p>
          </div>
        </div>
      </div>

      {/* Units Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-[#1565c0]" />
            <span>Course Units & Chapters</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a unit below to study corresponding topic notes and materials.
          </p>
        </div>

        {/* Filter Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter units..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5f90eb]"
          />
        </div>
      </div>

      {/* Units List */}
      <div className="space-y-3">
        {visibleChapters.map((chapter) => (
          <div
            key={chapter.id}
            id={`chapter-row-${chapter.id}`}
            onClick={() => onSelectChapter(chapter.id)}
            className="group bg-white rounded-xl p-4 sm:p-5 border border-slate-200 hover:border-[#1e88e5] shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#1565c0] font-bold text-sm flex items-center justify-center shrink-0 group-hover:bg-[#1565c0] group-hover:text-white transition-colors">
                {chapter.order || '•'}
              </span>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold text-slate-800 group-hover:text-[#0d47a1] transition-colors truncate">
                  {chapter.title}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-[#1e88e5] transition-colors">
                <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        ))}

        {visibleChapters.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            No units found for this course.
          </div>
        )}
      </div>
    </div>
  );
};
