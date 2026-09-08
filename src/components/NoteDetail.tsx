import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Note, Chapter, Course } from '../types';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Download,
  Shield,
  BookOpen,
  Clock,
  Maximize,
  Minimize,
  Type,
  Sun,
  Moon,
  Coffee,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Sparkles,
  FileText,
  Lock,
  X,
  ZoomIn,
} from 'lucide-react';

interface NoteDetailProps {
  note: Note;
  chapter?: Chapter;
  course?: Course;
  chapterNotes?: Note[];
  onSelectNote?: (noteId: number) => void;
  onBack: () => void;
  onBackToCourse?: () => void;
  onBackToHome?: () => void;
}

type ReadingWidth = 'comfortable' | 'wide' | 'ultrawide' | 'fluid';
type ReadingTheme = 'light' | 'sepia' | 'dark';
type ReadingFontSize = 'small' | 'normal' | 'large' | 'xlarge';

export const NoteDetail: React.FC<NoteDetailProps> = ({
  note,
  chapter,
  course,
  chapterNotes = [],
  onSelectNote,
  onBack,
  onBackToCourse,
  onBackToHome,
}) => {
  // Reading preferences stored in localStorage
  const [readingWidth, setReadingWidth] = useState<ReadingWidth>(() => {
    return (localStorage.getItem('kics_reader_width') as ReadingWidth) || 'wide';
  });
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>(() => {
    return (localStorage.getItem('kics_reader_theme') as ReadingTheme) || 'light';
  });
  const [fontSize, setFontSize] = useState<ReadingFontSize>(() => {
    return (localStorage.getItem('kics_reader_font') as ReadingFontSize) || 'normal';
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [privacyToast, setPrivacyToast] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerPrivacyToast = (msg: string) => {
    setPrivacyToast(msg);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setPrivacyToast(null);
    }, 2800);
  };

  // Strict Content Protection Handlers (Anti-Copy, Anti-Right Click, Anti-Print, Anti-Select)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerPrivacyToast('🔒 Content Protected: Context menu is disabled to safeguard lecture notes.');
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      // Block Ctrl/Cmd + C, X, U, S, A, P
      if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'u', 's', 'a', 'p'].includes(key)) {
        e.preventDefault();
        triggerPrivacyToast('🔒 Content Protected: Copying, saving, and printing are disabled.');
      }
      // Block PrintScreen key
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        triggerPrivacyToast('🔒 Content Protected: Screen capture restricted for educational materials.');
      }
      // Block Developer Tools shortcuts
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
      ) {
        e.preventDefault();
      }
    };

    const handleCopyCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerPrivacyToast('🔒 Content Protected: Copying lecture content is not permitted.');
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', '');
      }
    };

    const handleSelectStart = (e: Event) => {
      // Allow buttons and inputs to be clickable, but prevent text dragging selection inside note
      const target = e.target as HTMLElement;
      if (!target.closest('button, input, select, textarea, a')) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  // Post-process Tables and Images inside the rendered HTML for Mobile Perfection
  useEffect(() => {
    if (!contentRef.current) return;

    // 1. Process all tables: Ensure they are wrapped in an overflow container with mobile swipe prompt
    const tables = contentRef.current.querySelectorAll('table');
    tables.forEach((table) => {
      if (!table.parentElement?.classList.contains('table-responsive-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive-wrapper my-4 relative group shadow-xs';
        
        // Add mobile-friendly swipe hint badge
        const badge = document.createElement('div');
        badge.className = 'sm:hidden px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between';
        badge.innerHTML = '<span>📊 Data Table</span><span class="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">Swipe sideways ↔</span>';
        
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(badge);
        wrapper.appendChild(table);
      }
    });

    // 2. Process all images: prevent dragging, add zoom title and lightbox click handler
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.setAttribute('draggable', 'false');
      img.classList.add('cursor-zoom-in');
      img.title = 'Tap or click to view full resolution';
      img.onclick = () => {
        setLightboxImage({
          src: img.src,
          alt: img.alt || 'Lecture Illustration',
        });
      };
    });
  }, [note.content]);

  // Track scroll progress and scroll-to-top visibility
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
      setShowScrollTop(window.scrollY > 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
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

  const handleWidthChange = (w: ReadingWidth) => {
    setReadingWidth(w);
    localStorage.setItem('kics_reader_width', w);
  };

  const handleThemeChange = (t: ReadingTheme) => {
    setReadingTheme(t);
    localStorage.setItem('kics_reader_theme', t);
  };

  const handleFontSizeChange = (fs: ReadingFontSize) => {
    setFontSize(fs);
    localStorage.setItem('kics_reader_font', fs);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate lecture navigation (Previous / Next)
  const { prevNote, nextNote, currentIndex, totalLectures } = useMemo(() => {
    const visibleList = chapterNotes
      .filter((n) => n.is_visible !== false)
      .sort((a, b) => (a.topic_number || 0) - (b.topic_number || 0) || a.id - b.id);

    const idx = visibleList.findIndex((n) => n.id === note.id);
    return {
      prevNote: idx > 0 ? visibleList[idx - 1] : null,
      nextNote: idx >= 0 && idx < visibleList.length - 1 ? visibleList[idx + 1] : null,
      currentIndex: idx,
      totalLectures: visibleList.length,
    };
  }, [chapterNotes, note.id]);

  // Calculate reading time & word count
  const { wordCount, readMinutes } = useMemo(() => {
    const text = (note.content || '').replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 190));
    return { wordCount: words, readMinutes: mins };
  }, [note.content]);

  // Width classes
  const containerWidthClass = {
    comfortable: 'max-w-4xl',
    wide: 'max-w-6xl',
    ultrawide: 'max-w-7xl',
    fluid: 'max-w-full px-2 sm:px-6 lg:px-12',
  }[readingWidth];

  // Theme styling classes
  const themeCardClasses = {
    light: 'bg-white border-slate-200/80 text-slate-800 shadow-xl',
    sepia: 'bg-[#FAF6F0] border-[#E8DFC8] text-[#2C2523] shadow-xl',
    dark: 'bg-[#1e293b] border-slate-700 text-slate-100 shadow-2xl',
  }[readingTheme];

  const themeInnerBackground = {
    light: 'bg-white',
    sepia: 'bg-[#FAF6F0]',
    dark: 'bg-[#1e293b]',
  }[readingTheme];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 select-none pb-20 note-content-protected ${
        readingTheme === 'dark'
          ? 'bg-[#0f172a] text-slate-100 theme-dark'
          : readingTheme === 'sepia'
          ? 'bg-[#F4ECE1] text-[#2C2523] theme-sepia'
          : 'bg-[#f8f9fa] text-slate-900'
      } font-size-${fontSize}`}
    >
      {/* Top Reading Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-[#5f90eb] via-[#ce03f6] to-emerald-400 z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Privacy Notice Floating Toast */}
      {privacyToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-none max-w-[90vw] text-center">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{privacyToast}</span>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal for Mobile and Desktop Inspection */}
      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxImage(null)}
        >
          <div className="w-full max-w-4xl flex items-center justify-between text-white/80 mb-2 px-2">
            <span className="text-xs font-medium truncate max-w-[70vw]">{lightboxImage.alt}</span>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Close image view"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            className="relative max-w-4xl max-h-[85vh] overflow-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.src}
              alt={lightboxImage.alt}
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-white/10"
              draggable={false}
            />
          </div>
          <p className="text-[11px] text-white/50 mt-2 text-center select-none">
            Tap anywhere outside or press Close to return to lecture
          </p>
        </div>
      )}

      {/* Main Container with User-Selected Width */}
      <div className={`${containerWidthClass} mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 transition-all duration-300`}>
        {/* Top Control Bar & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 overflow-x-auto py-1 scrollbar-none">
            <button
              id="breadcrumb-home"
              onClick={onBackToHome || onBack}
              className="hover:text-[#5f90eb] font-medium transition-colors shrink-0 cursor-pointer"
            >
              Courses
            </button>
            {course && (
              <>
                <span className="opacity-40">/</span>
                <button
                  id="breadcrumb-course"
                  onClick={onBackToCourse || onBack}
                  className="hover:text-[#5f90eb] font-medium transition-colors truncate max-w-[120px] sm:max-w-[180px] shrink-0 cursor-pointer"
                  title={course.title}
                >
                  {course.title}
                </button>
              </>
            )}
            {chapter && (
              <>
                <span className="opacity-40">/</span>
                <button
                  id="breadcrumb-chapter"
                  onClick={onBack}
                  className="hover:text-[#5f90eb] font-medium transition-colors truncate max-w-[120px] sm:max-w-[180px] shrink-0 cursor-pointer"
                  title={chapter.title}
                >
                  {chapter.title}
                </button>
              </>
            )}
            <span className="opacity-40">/</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px] sm:max-w-[220px]">
              Topic #{note.topic_number || 1}
            </span>
          </nav>

          {/* Quick Header Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <button
              id="back-to-chapter-btn"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1565c0] hover:text-[#0d47a1] px-3 py-1.5 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Lectures</span>
            </button>

            {/* Quick Navigation to Prev/Next in Chapter */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => prevNote && onSelectNote && onSelectNote(prevNote.id)}
                disabled={!prevNote || !onSelectNote}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title={prevNote ? `Previous: ${prevNote.title}` : 'No previous lecture'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {totalLectures > 0 && (
                <span className="text-[11px] font-mono px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 font-semibold">
                  {currentIndex + 1}/{totalLectures}
                </span>
              )}
              <button
                type="button"
                onClick={() => nextNote && onSelectNote && onSelectNote(nextNote.id)}
                disabled={!nextNote || !onSelectNote}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                title={nextNote ? `Next: ${nextNote.title}` : 'No next lecture'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Reader Convenience Controls Bar (Desktop & Tablet) */}
        <div className="reader-toolbar bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-2.5 sm:p-3 mb-4 sm:mb-5 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
          {/* Left: Reading Stats & Privacy Shield */}
          <div className="flex items-center gap-2.5 sm:gap-3 text-slate-600 dark:text-slate-300 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#5f90eb]" />
              <span>{readMinutes} min read</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
              {wordCount.toLocaleString()} words
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
            <span className="hidden sm:inline-flex text-emerald-600 dark:text-emerald-400 font-medium items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              Protected Study Content
            </span>
          </div>

          {/* Right: Customization Controls (Width, Font Size, Theme, Fullscreen) - NO PRINT BUTTON */}
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            {/* Reading Width Selector */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-0.5 border border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => handleWidthChange('comfortable')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readingWidth === 'comfortable'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Comfortable width (Compact)"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('wide')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readingWidth === 'wide'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Wide reading canvas (Recommended)"
              >
                Wide
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('ultrawide')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readingWidth === 'ultrawide'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="Expanded wide"
              >
                Extra Wide
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('fluid')}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  readingWidth === 'fluid'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
                title="100% Full Width"
              >
                Full
              </button>
            </div>

            {/* Font Size Adjuster */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-0.5 border border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => handleFontSizeChange('small')}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                  fontSize === 'small'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Smaller Font"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('normal')}
                className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Default Font"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('large')}
                className={`px-2 py-1 rounded-lg text-sm font-bold cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Large Font"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleFontSizeChange('xlarge')}
                className={`px-1.5 py-1 rounded-lg text-base font-bold cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
                title="Extra Large Font"
              >
                A++
              </button>
            </div>

            {/* Theme Presets (Day, Sepia, Night) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-0.5 border border-slate-200 dark:border-slate-600">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                  readingTheme === 'light'
                    ? 'bg-white text-amber-500 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Day Reading Mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('sepia')}
                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                  readingTheme === 'sepia'
                    ? 'bg-[#FAF6F0] text-[#a0612c] shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Eye-Care Sepia Book Mode"
              >
                <Coffee className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`p-1.5 rounded-lg cursor-pointer transition-all ${
                  readingTheme === 'dark'
                    ? 'bg-slate-900 text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
                title="Night Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
              title={isFullscreen ? 'Exit Fullscreen Reader' : 'Distraction-Free Fullscreen'}
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Primary Lecture Note Container Card */}
        <article
          className={`rounded-2xl sm:rounded-3xl border overflow-hidden transition-all duration-200 ${themeCardClasses}`}
        >
          {/* Institute Gradient Banner Header */}
          <div className="bg-gradient-to-r from-[#5f90eb] via-[#8545f1] to-[#ce03f6] text-white p-4 sm:p-7 md:p-9 relative overflow-hidden">
            {/* Background Pattern Accent */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-end pr-6">
              <BookOpen className="w-48 h-48 -rotate-12" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-white/90 text-xs font-semibold mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white border border-white/30 text-[11px] sm:text-xs font-bold font-mono">
                  Lecture Topic #{note.topic_number || 1}
                </span>
                {note.publish_date && (
                  <span className="flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs">
                    <Calendar className="w-3 h-3 inline" />
                    Published: {note.publish_date}
                  </span>
                )}
                {chapter && (
                  <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs">
                    Unit: {chapter.title}
                  </span>
                )}
              </div>

              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug mt-1">
                {note.title}
              </h1>

              {course && (
                <p className="mt-1.5 text-white/80 text-xs sm:text-sm font-medium">
                  Course: {course.title}
                </p>
              )}
            </div>
          </div>

          {/* Reader Content Body with Touch and Mobile Optimization */}
          <div className={`p-3.5 sm:p-7 md:p-9 lg:p-11 ${themeInnerBackground}`}>
            {/* Rich Note Content */}
            <div
              ref={contentRef}
              id="rendered-note-content"
              className="note-rendered-html max-w-none prose prose-slate dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-[#5f90eb] prose-a:underline hover:prose-a:text-[#1565c0] overflow-hidden"
              dangerouslySetInnerHTML={{ __html: note.content || '<p>No content available for this lecture.</p>' }}
            />

            {/* Downloadable File Attachment if Present */}
            {note.file && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#1565c0] dark:text-blue-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                        Lecture Reference Document
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        {note.file.replace('notes/', '')}
                      </p>
                    </div>
                  </div>

                  <a
                    id="note-download-attachment-btn"
                    href={`/media/${note.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#5f90eb] to-[#ce03f6] hover:from-[#4b7de2] hover:to-[#a902d9] text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Material</span>
                  </a>
                </div>
              </div>
            )}

            {/* Bottom Lecture Navigation Cards (Previous / Next) */}
            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 reader-nav-footer">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Previous Note Button */}
                {prevNote ? (
                  <button
                    type="button"
                    onClick={() => onSelectNote && onSelectNote(prevNote.id)}
                    className="text-left p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      <ArrowLeft className="w-3.5 h-3.5 text-blue-500 transition-transform group-hover:-translate-x-1" />
                      <span>Previous Lecture</span>
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      #{prevNote.topic_number || 1} • {prevNote.title}
                    </div>
                  </button>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Next Note Button */}
                {nextNote ? (
                  <button
                    type="button"
                    onClick={() => onSelectNote && onSelectNote(nextNote.id)}
                    className="text-right p-3 sm:p-4 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 hover:border-blue-400 transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-end gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
                      <span>Next Lecture</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-500 transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                      #{nextNote.topic_number || 1} • {nextNote.title}
                    </div>
                  </button>
                ) : (
                  <div className="p-3 sm:p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-right">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-end gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Unit Completed!
                    </span>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Return to course units to begin the next chapter.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Copyright & Institute Protection Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 gap-2">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                Protected Educational Material • Karamraji Institute
              </span>
              <span>Copying & Printing Disabled for Exam Integrity</span>
            </div>
          </div>
        </article>
      </div>

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-16 right-3 sm:bottom-6 sm:right-6 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900/90 text-white hover:bg-slate-900 shadow-xl backdrop-blur-xs flex items-center justify-center transition-all z-40 cursor-pointer active:scale-95"
          title="Scroll to Top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Mobile Sticky Bottom Reading Toolbar (Allows one-thumb navigation on phones!) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-2xl">
        <button
          type="button"
          onClick={() => prevNote && onSelectNote && onSelectNote(prevNote.id)}
          disabled={!prevNote || !onSelectNote}
          className="flex-1 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:bg-slate-200 truncate"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
          <span>Prev</span>
        </button>

        {/* Font size toggle for mobile */}
        <button
          type="button"
          onClick={() => {
            const nextMap: Record<ReadingFontSize, ReadingFontSize> = {
              small: 'normal',
              normal: 'large',
              large: 'xlarge',
              xlarge: 'small',
            };
            handleFontSizeChange(nextMap[fontSize]);
          }}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 min-w-[38px]"
          title="Toggle font size"
        >
          <Type className="w-3.5 h-3.5 mr-0.5" />
          <span className="text-[10px] uppercase font-mono">{fontSize.slice(0, 2)}</span>
        </button>

        {/* Theme toggle for mobile */}
        <button
          type="button"
          onClick={() => {
            const nextTheme: Record<ReadingTheme, ReadingTheme> = {
              light: 'sepia',
              sepia: 'dark',
              dark: 'light',
            };
            handleThemeChange(nextTheme[readingTheme]);
          }}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0"
          title="Toggle theme"
        >
          {readingTheme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {readingTheme === 'sepia' && <Coffee className="w-4 h-4 text-[#a0612c]" />}
          {readingTheme === 'dark' && <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        <button
          type="button"
          onClick={() => nextNote && onSelectNote && onSelectNote(nextNote.id)}
          disabled={!nextNote || !onSelectNote}
          className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 text-xs font-bold text-white flex items-center justify-center gap-1 disabled:opacity-30 disabled:pointer-events-none active:bg-blue-700 shadow-xs truncate"
        >
          <span>Next</span>
          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>
    </div>
  );
};
