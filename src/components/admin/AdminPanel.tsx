import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FolderTree,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Search,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Paperclip,
  Check,
  LogOut,
  User as UserIcon,
  Users,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Maximize,
  Minimize,
} from 'lucide-react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../../firebase';
import { Course, Chapter, Note, Student } from '../../types';
import {
  fetchCourses,
  fetchChapters,
  fetchNotes,
  fetchStudents,
  saveCourse,
  deleteCourse,
  saveChapter,
  deleteChapter,
  saveNote,
  deleteNote,
  toggleNoteVisibility,
} from '../../services/portalService';
import { RichTextEditor } from './RichTextEditor';
import { StudentManager } from './StudentManager';

interface AdminPanelProps {
  onClose: () => void;
  onRefreshData?: () => void;
}

type TabType = 'notes' | 'chapters' | 'courses' | 'overview' | 'students';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, onRefreshData }) => {
  const [activeTab, setActiveTab] = useState<TabType>('notes');
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    onClose();
  };

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourseId, setFilterCourseId] = useState<number | 'all'>('all');
  const [filterChapterId, setFilterChapterId] = useState<number | 'all'>('all');

  // Note Modal / Form State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [noteCourseId, setNoteCourseId] = useState<number>(0);
  const [isNoteDetailsCollapsed, setIsNoteDetailsCollapsed] = useState(false);
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  // Monitor browser fullscreen status
  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Course Modal State
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);

  // Chapter Modal State
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesData, chaptersData, notesData, studentsData] = await Promise.all([
        fetchCourses(),
        fetchChapters(),
        fetchNotes(),
        fetchStudents(),
      ]);
      setCourses(coursesData);
      setChapters(chaptersData);
      setNotes(notesData);
      setStudents(studentsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const notify = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // ---------------------------------------------
  // Course Handlers
  // ---------------------------------------------
  const handleOpenNewCourse = () => {
    setEditingCourse({
      title: '',
      description: '',
      is_visible: true,
    });
    setIsCourseModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse({ ...course });
    setIsCourseModalOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse || !editingCourse.title?.trim()) {
      alert('Please enter a course title.');
      return;
    }

    try {
      await saveCourse({
        id: editingCourse.id,
        title: editingCourse.title,
        description: editingCourse.description || '',
        is_visible: editingCourse.is_visible ?? true,
      });
      setIsCourseModalOpen(false);
      setEditingCourse(null);
      notify('Course saved successfully!');
      await loadData();
      onRefreshData?.();
    } catch (err) {
      alert('Failed to save course: ' + String(err));
    }
  };

  const handleDeleteCourse = async (course: Course) => {
    if (window.confirm(`Are you sure you want to delete course "${course.title}"?`)) {
      await deleteCourse(course.id);
      notify(`Course "${course.title}" deleted.`);
      await loadData();
      onRefreshData?.();
    }
  };

  // ---------------------------------------------
  // Chapter Handlers
  // ---------------------------------------------
  const handleOpenNewChapter = (preselectCourseId?: number) => {
    const courseId = preselectCourseId || (courses.length > 0 ? courses[0].id : 0);
    const existingInCourse = chapters.filter((c) => c.course_id === courseId);
    setEditingChapter({
      course_id: courseId,
      title: '',
      order: existingInCourse.length + 1,
      is_visible: true,
    });
    setIsChapterModalOpen(true);
  };

  const handleEditChapter = (chapter: Chapter) => {
    setEditingChapter({ ...chapter });
    setIsChapterModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter || !editingChapter.title?.trim()) {
      alert('Please enter a chapter title.');
      return;
    }
    if (!editingChapter.course_id) {
      alert('Please select a parent course.');
      return;
    }

    try {
      await saveChapter({
        id: editingChapter.id,
        course_id: editingChapter.course_id,
        title: editingChapter.title,
        order: editingChapter.order || 1,
        is_visible: editingChapter.is_visible ?? true,
      });
      setIsChapterModalOpen(false);
      setEditingChapter(null);
      notify('Chapter / Unit saved successfully!');
      await loadData();
      onRefreshData?.();
    } catch (err) {
      alert('Failed to save chapter: ' + String(err));
    }
  };

  const handleDeleteChapter = async (chapter: Chapter) => {
    if (window.confirm(`Are you sure you want to delete unit "${chapter.title}"?`)) {
      await deleteChapter(chapter.id);
      notify(`Chapter "${chapter.title}" deleted.`);
      await loadData();
      onRefreshData?.();
    }
  };

  // ---------------------------------------------
  // Note Handlers
  // ---------------------------------------------
  const handleOpenNewNote = () => {
    const defaultCourse = courses.length > 0 ? courses[0].id : 0;
    const availableChapters = chapters.filter((c) => c.course_id === defaultCourse);
    const defaultChapter = availableChapters.length > 0 ? availableChapters[0].id : (chapters[0]?.id || 0);
    const today = new Date().toISOString().split('T')[0];

    setNoteCourseId(defaultCourse);
    setEditingNote({
      title: '',
      chapter_id: defaultChapter,
      topic_number: 1,
      publish_date: today,
      content: '<p>Start typing lecture notes...</p>',
      is_visible: true,
      file: null,
    });
    setIsNoteModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    const parentChapter = chapters.find((c) => c.id === note.chapter_id);
    setNoteCourseId(parentChapter ? parentChapter.course_id : (courses[0]?.id || 0));
    setEditingNote({ ...note });
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingNote || !editingNote.title?.trim()) {
      alert('Please enter a note title.');
      return;
    }
    if (!editingNote.chapter_id) {
      alert('Please select a unit/chapter.');
      return;
    }

    try {
      await saveNote({
        id: editingNote.id,
        chapter_id: editingNote.chapter_id,
        title: editingNote.title,
        topic_number: editingNote.topic_number || 1,
        content: editingNote.content || '',
        publish_date: editingNote.publish_date || new Date().toISOString().split('T')[0],
        file: editingNote.file || null,
        is_visible: editingNote.is_visible ?? true,
      });
      setIsNoteModalOpen(false);
      setEditingNote(null);
      notify('Lecture Note saved successfully!');
      await loadData();
      onRefreshData?.();
    } catch (err) {
      alert('Failed to save note: ' + String(err));
    }
  };

  // Keyboard shortcut Ctrl+S / Cmd+S to save note while editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isNoteModalOpen && editingNote) {
          e.preventDefault();
          handleSaveNote();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNoteModalOpen, editingNote]);

  const handleDeleteNote = async (note: Note) => {
    if (window.confirm(`Are you sure you want to delete lecture note "${note.title}"?`)) {
      await deleteNote(note.id);
      notify(`Note "${note.title}" deleted.`);
      await loadData();
      onRefreshData?.();
    }
  };

  const handleToggleNoteVisibility = async (note: Note) => {
    const nextVal = await toggleNoteVisibility(note.id, note.is_visible);
    setNotes((prev) =>
      prev.map((n) => (n.id === note.id ? { ...n, is_visible: nextVal } : n))
    );
    notify(`Note visibility updated to ${nextVal ? 'Visible' : 'Hidden'}.`);
    onRefreshData?.();
  };

  // Filtered Notes
  const filteredNotes = notes.filter((n) => {
    const matchSearch =
      searchTerm === '' ||
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.content.toLowerCase().includes(searchTerm.toLowerCase());

    const noteChapter = chapters.find((ch) => ch.id === n.chapter_id);
    const matchCourse =
      filterCourseId === 'all' || (noteChapter && noteChapter.course_id === filterCourseId);

    const matchChapter =
      filterChapterId === 'all' || n.chapter_id === filterChapterId;

    return matchSearch && matchCourse && matchChapter;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col overflow-hidden text-slate-800">
      {/* Top Admin Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-xl font-bold tracking-tight">KICS Admin & Teacher Portal</h1>
          </div>
          <span className="text-xs bg-blue-600 text-blue-100 px-2.5 py-0.5 rounded-full font-medium">
            Django-Equivalent Admin
          </span>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono">{currentUser.email}</span>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title="Sign out of Admin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg border border-red-500/30 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Student Portal</span>
          </button>
        </div>
      </header>

      {/* Sub Navigation Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shrink-0">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notes'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Lecture Notes ({notes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('chapters')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'chapters'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Chapters / Units ({chapters.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'courses'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses ({courses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'students'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Students ({students.length})</span>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'courses' && (
            <button
              onClick={handleOpenNewCourse}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Course</span>
            </button>
          )}
          {activeTab === 'chapters' && (
            <button
              onClick={() => handleOpenNewChapter()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Chapter / Unit</span>
            </button>
          )}
          {(activeTab === 'notes' || activeTab === 'overview') && (
            <button
              onClick={handleOpenNewNote}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Upload / Write Note</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-6 py-2.5 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm">Loading admin data...</p>
          </div>
        ) : (
          <>
            {/* TAB: LECTURE NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                {/* Search and Filters bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search lecture notes by title or content..."
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  {/* Filter by Course */}
                  <select
                    value={filterCourseId}
                    onChange={(e) => {
                      const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                      setFilterCourseId(val);
                      setFilterChapterId('all');
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
                  >
                    <option value="all">All Courses</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>

                  {/* Filter by Chapter */}
                  <select
                    value={filterChapterId}
                    onChange={(e) =>
                      setFilterChapterId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 max-w-[240px]"
                  >
                    <option value="all">All Chapters</option>
                    {chapters
                      .filter((ch) => filterCourseId === 'all' || ch.course_id === filterCourseId)
                      .map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.title}
                        </option>
                      ))}
                  </select>

                  <div className="text-xs text-slate-500 ml-auto font-medium">
                    Showing {filteredNotes.length} of {notes.length} notes
                  </div>
                </div>

                {/* Notes Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                        <tr>
                          <th className="py-3 px-4 w-14">#</th>
                          <th className="py-3 px-4">Lecture Title</th>
                          <th className="py-3 px-4">Course & Unit</th>
                          <th className="py-3 px-4 w-32">Date</th>
                          <th className="py-3 px-4 w-28 text-center">Status</th>
                          <th className="py-3 px-4 w-36 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredNotes.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-slate-500">
                              No lecture notes found matching filters.
                            </td>
                          </tr>
                        ) : (
                          filteredNotes.map((note) => {
                            const chapter = chapters.find((c) => c.id === note.chapter_id);
                            const course = chapter
                              ? courses.find((co) => co.id === chapter.course_id)
                              : undefined;

                            return (
                              <tr key={note.id} className="hover:bg-slate-50/75 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs text-slate-500">
                                  {note.topic_number}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-semibold text-slate-900">{note.title}</div>
                                  {note.file && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                                      <Paperclip className="w-3 h-3" />
                                      <span className="truncate max-w-xs">{note.file}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-600">
                                  <div className="font-medium text-slate-800">{course?.title || 'Unknown Course'}</div>
                                  <div className="text-slate-500 truncate max-w-[200px]">{chapter?.title || 'Unknown Unit'}</div>
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                  {note.publish_date || '—'}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => handleToggleNoteVisibility(note)}
                                    title="Click to toggle visibility"
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                                      note.is_visible
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                    }`}
                                  >
                                    {note.is_visible ? (
                                      <>
                                        <Eye className="w-3 h-3" />
                                        <span>Visible</span>
                                      </>
                                    ) : (
                                      <>
                                        <EyeOff className="w-3 h-3" />
                                        <span>Hidden</span>
                                      </>
                                    )}
                                  </button>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      onClick={() => handleEditNote(note)}
                                      title="Edit note"
                                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNote(note)}
                                      title="Delete note"
                                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CHAPTERS / UNITS */}
            {activeTab === 'chapters' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Chapters & Units Organization</h2>
                  <button
                    onClick={() => handleOpenNewChapter()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Unit</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((course) => {
                    const courseChapters = chapters.filter((ch) => ch.course_id === course.id);
                    return (
                      <div key={course.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            <h3 className="font-bold text-slate-900">{course.title}</h3>
                          </div>
                          <button
                            onClick={() => handleOpenNewChapter(course.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to this course</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {courseChapters.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">No chapters yet in this course.</p>
                          ) : (
                            courseChapters.map((ch) => {
                              const notesCount = notes.filter((n) => n.chapter_id === ch.id).length;
                              return (
                                <div
                                  key={ch.id}
                                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100"
                                >
                                  <div className="flex items-center gap-2 min-w-0 pr-2">
                                    <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                                      Ord {ch.order}
                                    </span>
                                    <span className="text-sm font-medium text-slate-800 truncate">{ch.title}</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0 font-medium">
                                      {notesCount} notes
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => handleEditChapter(ch)}
                                      className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteChapter(ch)}
                                      className="p-1 text-slate-500 hover:text-red-600 hover:bg-white rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: COURSES */}
            {activeTab === 'courses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">Manage Courses</h2>
                  <button
                    onClick={handleOpenNewCourse}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Course</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((c) => {
                    const chCount = chapters.filter((ch) => ch.course_id === c.id).length;
                    return (
                      <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-bold text-slate-900 text-base">{c.title}</h3>
                            <span
                              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                c.is_visible ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {c.is_visible ? 'Visible' : 'Hidden'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-3 mb-4">{c.description || 'No description provided.'}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                          <span>{chCount} Chapters registered</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditCourse(c)}
                              className="px-2.5 py-1 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md font-medium transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c)}
                              className="px-2.5 py-1 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Courses</div>
                    <div className="text-3xl font-extrabold text-blue-600">{courses.length}</div>
                    <p className="text-xs text-slate-400 mt-2">Active syllabus modules</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Chapters / Units</div>
                    <div className="text-3xl font-extrabold text-purple-600">{chapters.length}</div>
                    <p className="text-xs text-slate-400 mt-2">Organized topical chapters</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Lecture Notes</div>
                    <div className="text-3xl font-extrabold text-emerald-600">{notes.length}</div>
                    <p className="text-xs text-slate-400 mt-2">Rich text lectures published</p>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-1">Public vs Hidden</div>
                    <div className="text-2xl font-bold text-slate-800">
                      {notes.filter((n) => n.is_visible).length} / {notes.filter((n) => !n.is_visible).length}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Visible / Hidden notes</p>
                  </div>
                </div>

                {/* Quick actions box */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        <span>Teacher Administration Workspace</span>
                      </h3>
                      <p className="text-blue-100 text-sm mt-1 max-w-xl">
                        Just like in your Django admin, you can create and manage courses, units, and rich-text lecture notes with images, code snippets, and attachments.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleOpenNewNote}
                        className="px-4 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-lg shadow-xs text-sm transition-colors"
                      >
                        + Write New Lecture Note
                      </button>
                      <button
                        onClick={() => handleOpenNewChapter()}
                        className="px-4 py-2.5 bg-blue-800/60 hover:bg-blue-800 text-white font-medium rounded-lg text-sm transition-colors border border-blue-400/30"
                      >
                        + Add Unit
                      </button>
                      <button
                        onClick={handleOpenNewCourse}
                        className="px-4 py-2.5 bg-blue-800/60 hover:bg-blue-800 text-white font-medium rounded-lg text-sm transition-colors border border-blue-400/30"
                      >
                        + Add Course
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent notes preview list */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                  <h4 className="font-bold text-slate-900 mb-3 text-base">Latest Added Notes</h4>
                  <div className="divide-y divide-slate-100">
                    {notes.slice(0, 5).map((n) => (
                      <div key={n.id} className="py-2.5 flex items-center justify-between">
                        <div className="min-w-0 pr-4">
                          <div className="font-semibold text-sm text-slate-800 truncate">{n.title}</div>
                          <div className="text-xs text-slate-500">Published: {n.publish_date || 'N/A'}</div>
                        </div>
                        <button
                          onClick={() => handleEditNote(n)}
                          className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-colors shrink-0"
                        >
                          Edit Content
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: STUDENTS MANAGEMENT */}
            {activeTab === 'students' && (
              <StudentManager
                students={students}
                courses={courses}
                onRefresh={loadData}
                notify={notify}
              />
            )}
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* NOTE EDITOR - TRUE 100% FULL-SCREEN WORKSPACE             */}
      {/* ========================================================= */}
      {isNoteModalOpen && editingNote && (
        <div className="fixed inset-0 z-[100] w-screen h-screen bg-white flex flex-col m-0 p-0 rounded-none border-0 overflow-hidden">
          {/* Header Bar */}
          <div className="px-4 py-2.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800 z-30 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700 shrink-0"
                title="Exit Editor and return to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Exit Editor</span>
              </button>

              <div className="w-px h-5 bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono shrink-0">
                  Topic #{editingNote.topic_number || 1}
                </span>
                <h3 className="font-bold text-sm text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                  {editingNote.title || 'Untitled Lecture Note'}
                </h3>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsNoteDetailsCollapsed(!isNoteDetailsCollapsed)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Toggle metadata section"
              >
                {isNoteDetailsCollapsed ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Show Details</span>
                  </>
                ) : (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Hide Details</span>
                  </>
                )}
              </button>

              {/* Browser Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleBrowserFullscreen}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title={isBrowserFullscreen ? 'Exit Browser Fullscreen' : 'Enter Full Screen Mode'}
              >
                {isBrowserFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsNoteModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSaveNote()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                title="Save Lecture Note (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Note</span>
                <span className="text-[10px] opacity-75 font-mono hidden md:inline">Ctrl+S</span>
              </button>
            </div>
          </div>

          {/* Editor Workspace Form */}
          <form onSubmit={handleSaveNote} className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
            {/* Collapsible Metadata bar */}
            {!isNoteDetailsCollapsed && (
              <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 shadow-2xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Course */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Course Module *
                    </label>
                    <select
                      value={noteCourseId}
                      onChange={(e) => {
                        const cId = Number(e.target.value);
                        setNoteCourseId(cId);
                        const available = chapters.filter((ch) => ch.course_id === cId);
                        if (available.length > 0) {
                          setEditingNote((prev) => (prev ? { ...prev, chapter_id: available[0].id } : null));
                        }
                      }}
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Chapter */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Chapter / Unit *
                    </label>
                    <select
                      value={editingNote.chapter_id}
                      onChange={(e) =>
                        setEditingNote((prev) => (prev ? { ...prev, chapter_id: Number(e.target.value) } : null))
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      {chapters
                        .filter((ch) => noteCourseId === 0 || ch.course_id === noteCourseId)
                        .map((ch) => (
                          <option key={ch.id} value={ch.id}>
                            {ch.title}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Lecture Title */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Lecture Title *
                    </label>
                    <input
                      type="text"
                      value={editingNote.title || ''}
                      onChange={(e) =>
                        setEditingNote((prev) => (prev ? { ...prev, title: e.target.value } : null))
                      }
                      placeholder="e.g. Introduction to computer systems"
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                      required
                    />
                  </div>

                  {/* Topic Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Topic / Lecture #
                    </label>
                    <input
                      type="number"
                      value={editingNote.topic_number || 1}
                      onChange={(e) =>
                        setEditingNote((prev) => (prev ? { ...prev, topic_number: Number(e.target.value) } : null))
                      }
                      className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                      min={1}
                    />
                  </div>
                </div>

                {/* Secondary Details Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Publish Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={editingNote.publish_date || ''}
                        onChange={(e) =>
                          setEditingNote((prev) => (prev ? { ...prev, publish_date: e.target.value } : null))
                        }
                        className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                      Downloadable File Attachment (Optional)
                    </label>
                    <div className="relative">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={editingNote.file || ''}
                        onChange={(e) =>
                          setEditingNote((prev) => (prev ? { ...prev, file: e.target.value } : null))
                        }
                        placeholder="e.g. notes/Unit1_Lecture_Slide.pdf"
                        className="w-full text-xs border border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-4">
                    <input
                      type="checkbox"
                      id="noteVisibleCheckbox"
                      checked={editingNote.is_visible ?? true}
                      onChange={(e) =>
                        setEditingNote((prev) => (prev ? { ...prev, is_visible: e.target.checked } : null))
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="noteVisibleCheckbox" className="text-xs font-semibold text-slate-700 select-none cursor-pointer">
                      Lecture visible to students immediately
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Edge-to-Edge Rich Text Editor Canvas */}
            <div className="flex-1 min-h-0 flex flex-col p-0 overflow-hidden">
              <RichTextEditor
                value={editingNote.content || ''}
                onChange={(content) =>
                  setEditingNote((prev) => (prev ? { ...prev, content } : null))
                }
                fullHeight={true}
                placeholder="Type your lecture content, embed illustrations, code snippets, or paste HTML..."
              />
            </div>

            {/* Bottom Quick Save Footer */}
            <div className="px-4 py-2 bg-slate-900 text-white border-t border-slate-800 flex items-center justify-between shrink-0 z-20">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Full-Screen Editor Workspace Active</span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline text-slate-400">Press Ctrl+S to save</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Lecture Note</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* COURSE MODAL                                              */}
      {/* ========================================================= */}
      {isCourseModalOpen && editingCourse && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingCourse.id ? 'Edit Course' : 'Create New Course'}
              </h3>
              <button
                onClick={() => setIsCourseModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course Title *
                </label>
                <input
                  type="text"
                  value={editingCourse.title || ''}
                  onChange={(e) =>
                    setEditingCourse((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  placeholder="e.g. M1-R5.1 : IT Tools and Network Basics"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course Description
                </label>
                <textarea
                  rows={4}
                  value={editingCourse.description || ''}
                  onChange={(e) =>
                    setEditingCourse((prev) => (prev ? { ...prev, description: e.target.value } : null))
                  }
                  placeholder="Detailed course overview, syllabus goals..."
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="courseVisibleCheckbox"
                  checked={editingCourse.is_visible ?? true}
                  onChange={(e) =>
                    setEditingCourse((prev) => (prev ? { ...prev, is_visible: e.target.checked } : null))
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="courseVisibleCheckbox" className="text-sm font-medium text-slate-700 select-none">
                  Visible to students
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Course</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CHAPTER MODAL                                             */}
      {/* ========================================================= */}
      {isChapterModalOpen && editingChapter && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-lg">
                {editingChapter.id ? 'Edit Chapter / Unit' : 'Create Chapter / Unit'}
              </h3>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Course *
                </label>
                <select
                  value={editingChapter.course_id}
                  onChange={(e) =>
                    setEditingChapter((prev) => (prev ? { ...prev, course_id: Number(e.target.value) } : null))
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chapter / Unit Title *
                </label>
                <input
                  type="text"
                  value={editingChapter.title || ''}
                  onChange={(e) =>
                    setEditingChapter((prev) => (prev ? { ...prev, title: e.target.value } : null))
                  }
                  placeholder="e.g. Unit 1: Introduction to Operating System"
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Order
                </label>
                <input
                  type="number"
                  value={editingChapter.order || 1}
                  onChange={(e) =>
                    setEditingChapter((prev) => (prev ? { ...prev, order: Number(e.target.value) } : null))
                  }
                  className="w-full text-sm border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  min={1}
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  id="chapVisibleCheckbox"
                  checked={editingChapter.is_visible ?? true}
                  onChange={(e) =>
                    setEditingChapter((prev) => (prev ? { ...prev, is_visible: e.target.checked } : null))
                  }
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="chapVisibleCheckbox" className="text-sm font-medium text-slate-700 select-none">
                  Visible to students
                </label>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Chapter</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
