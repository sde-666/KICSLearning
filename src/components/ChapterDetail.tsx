import React, { useState } from 'react';
import { Chapter, Note } from '../types';
import { ArrowLeft, Sparkles, Calendar, FileText, Search } from 'lucide-react';

interface ChapterDetailProps {
  chapter: Chapter;
  notes: Note[];
  onBack: () => void;
  onSelectNote: (noteId: number) => void;
}

export const ChapterDetail: React.FC<ChapterDetailProps> = ({
  chapter,
  notes,
  onBack,
  onSelectNote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Hide notes where is_visible is false from public view
  const visibleNotes = notes.filter((n) => {
    if (!n.is_visible) return false;
    if (!searchTerm.trim()) return true;
    return (
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const latestNote = visibleNotes.length > 0 ? visibleNotes[0] : null;

  const getCleanSnippet = (html: string) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header controls: Back button */}
      <div className="flex items-center justify-between mb-6">
        <button
          id="back-to-course-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#1565c0] hover:text-[#0d47a1] px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Units</span>
        </button>
      </div>

      {/* Chapter Banner */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-md border border-slate-200 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-[#1565c0] to-[#5f90eb] rounded-xl text-white shadow-xs shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <span className="text-xs uppercase tracking-wider font-bold text-[#1565c0] bg-blue-50 px-2.5 py-1 rounded-md mb-2 inline-block">
              Unit {chapter.order || ''}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              {chapter.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base">
              Explore the lecture notes and practical demonstrations for this unit below.
            </p>
          </div>
        </div>
      </div>

      {/* Latest Lecture Highlight Card */}
      {latestNote && (
        <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1565c0] mb-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Featured / Most Recent Lecture</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{latestNote.title}</h3>
          <p className="text-slate-600 text-sm line-clamp-2 mb-4 leading-relaxed">
            {getCleanSnippet(latestNote.content)}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Published: {latestNote.publish_date || 'N/A'}
            </span>
            <button
              onClick={() => onSelectNote(latestNote.id)}
              className="px-4 py-2 bg-[#1565c0] hover:bg-[#0d47a1] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Read Full Lecture Note
            </button>
          </div>
        </div>
      )}

      {/* Notes Section Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
            Lecture Notes in this Unit ({visibleNotes.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select a topic to open the complete reading and reference view.
          </p>
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lectures in this unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#5f90eb]"
          />
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleNotes.map((note) => {
          const snippet = getCleanSnippet(note.content);
          return (
            <div
              key={note.id}
              id={`note-card-${note.id}`}
              onClick={() => onSelectNote(note.id)}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-[#1565c0] shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Topic #{note.topic_number || 1}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#1565c0] transition-colors mb-2 leading-snug">
                  {note.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-4">
                  {snippet || 'Detailed instructional notes and practical materials.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {note.publish_date || 'N/A'}
                </span>

                <span className="text-[#1565c0] font-semibold group-hover:underline flex items-center gap-1">
                  Open Note →
                </span>
              </div>
            </div>
          );
        })}

        {visibleNotes.length === 0 && (
          <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
            No notes found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};
