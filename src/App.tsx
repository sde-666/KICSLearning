import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CourseList } from './components/CourseList';
import { CourseDetail } from './components/CourseDetail';
import { ChapterDetail } from './components/ChapterDetail';
import { NoteDetail } from './components/NoteDetail';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminAuth } from './components/admin/AdminAuth';
import { StudentAuth } from './components/student/StudentAuth';
import { Course, Chapter, Note, Student, StudentSession } from './types';
import {
  fetchCourses,
  fetchChapters,
  fetchNotes,
  fetchNoteById,
  seedFirestoreIfEmpty,
  logoutStudent,
  listenToStudentSession,
} from './services/portalService';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNoteDetail, setCurrentNoteDetail] = useState<{
    note: Note;
    chapter?: Chapter;
    course?: Course;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Admin routing & authentication state
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    return (
      window.location.pathname.toLowerCase().startsWith('/admin') ||
      window.location.hash.toLowerCase().startsWith('#admin') ||
      window.location.search.toLowerCase().includes('admin')
    );
  });
  const [adminUser, setAdminUser] = useState<any>(() => {
    const session = localStorage.getItem('kics_admin_session_v1');
    if (session) {
      try {
        return JSON.parse(session);
      } catch {
        return { email: 'mradityapathak53@gmail.com' };
      }
    }
    return auth.currentUser;
  });

  // Sync URL changes (popstate & hashchange)
  useEffect(() => {
    const handleUrlCheck = () => {
      const isMatch =
        window.location.pathname.toLowerCase().startsWith('/admin') ||
        window.location.hash.toLowerCase().startsWith('#admin') ||
        window.location.search.toLowerCase().includes('admin');
      setIsAdminRoute(isMatch);
    };

    window.addEventListener('popstate', handleUrlCheck);
    window.addEventListener('hashchange', handleUrlCheck);
    return () => {
      window.removeEventListener('popstate', handleUrlCheck);
      window.removeEventListener('hashchange', handleUrlCheck);
    };
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });
    return () => unsub();
  }, []);

  // Student Session & Persistent Storage State
  const [studentSession, setStudentSession] = useState<StudentSession | null>(() => {
    try {
      const raw = localStorage.getItem('kics_student_session');
      if (raw) {
        return JSON.parse(raw) as StudentSession;
      }
      return null;
    } catch {
      return null;
    }
  });
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  // Real-time listener: single-session device validity & course permission updates
  useEffect(() => {
    if (!studentSession?.studentId || !studentSession?.sessionToken) return;

    const unsub = listenToStudentSession(
      studentSession.studentId,
      studentSession.sessionToken,
      (reason) => {
        // Instant termination of session when another login occurs or faculty deactivates
        localStorage.removeItem('kics_student_session');
        setStudentSession(null);
        setSessionNotice(reason);
      },
      (updatedStudent) => {
        // Real-time course access update if admin edits student permissions while logged in
        const updatedCourseIds =
          updatedStudent.course_ids && updatedStudent.course_ids.length > 0
            ? updatedStudent.course_ids
            : updatedStudent.course_id === 'all'
            ? ['all']
            : updatedStudent.course_id
            ? [updatedStudent.course_id]
            : ['all'];

        setStudentSession((prev) => {
          if (!prev) return null;
          const updatedSession: StudentSession = {
            ...prev,
            name: updatedStudent.name,
            course_id: updatedStudent.course_id || 'all',
            course_ids: updatedCourseIds,
          };
          localStorage.setItem('kics_student_session', JSON.stringify(updatedSession));
          return updatedSession;
        });
      },
      studentSession.loginTime
    );

    return () => unsub();
  }, [studentSession?.studentId, studentSession?.sessionToken, studentSession?.loginTime]);

  // Handle successful student login
  const handleStudentLoginSuccess = (student: Student, sessionToken: string) => {
    const studentCourseIds =
      student.course_ids && student.course_ids.length > 0
        ? student.course_ids
        : student.course_id === 'all'
        ? ['all']
        : student.course_id
        ? [student.course_id]
        : ['all'];

    const session: StudentSession = {
      studentId: student.id,
      name: student.name,
      course_id: student.course_id || 'all',
      course_ids: studentCourseIds,
      sessionToken,
      loginTime: new Date().toISOString(),
    };
    localStorage.setItem('kics_student_session', JSON.stringify(session));
    setStudentSession(session);
    setSessionNotice(null);

    // If student has access to exactly 1 specific course, automatically navigate into it
    if (!studentCourseIds.includes('all') && studentCourseIds.length === 1) {
      const numCourseId = Number(studentCourseIds[0]);
      if (!isNaN(numCourseId)) {
        setSelectedCourseId(numCourseId);
      }
    }
  };

  // Handle student logout
  const handleStudentLogout = async () => {
    if (studentSession?.studentId) {
      try {
        await logoutStudent(studentSession.studentId);
      } catch (err) {
        console.warn('Student logout error:', err);
      }
    }
    localStorage.removeItem('kics_student_session');
    setStudentSession(null);
    setSessionNotice(null);
    setSelectedCourseId(null);
    setSelectedChapterId(null);
    setSelectedNoteId(null);
  };

  // Refresh helper to reload whichever view is currently active
  const refreshCurrentView = useCallback(async () => {
    try {
      const cList = await fetchCourses();
      setCourses(cList);

      if (selectedCourseId !== null) {
        const chs = await fetchChapters(selectedCourseId);
        setChapters(chs);
      }
      if (selectedChapterId !== null) {
        const nts = await fetchNotes(selectedChapterId);
        setNotes(nts);
      }
      if (selectedNoteId !== null) {
        const detail = await fetchNoteById(selectedNoteId);
        setCurrentNoteDetail(detail);
      }
    } catch (e) {
      console.error('Error refreshing content:', e);
    }
  }, [selectedCourseId, selectedChapterId, selectedNoteId]);

  // Initial load
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      try {
        seedFirestoreIfEmpty().catch((err) => console.warn('Cloud seed check:', err));
        const cList = await fetchCourses();
        setCourses(cList);
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Fetch chapters for selectedCourseId
  useEffect(() => {
    if (selectedCourseId !== null) {
      setIsLoading(true);
      fetchChapters(selectedCourseId)
        .then((chs) => setChapters(chs))
        .finally(() => setIsLoading(false));
    }
  }, [selectedCourseId]);

  // Fetch notes for selectedChapterId
  useEffect(() => {
    if (selectedChapterId !== null) {
      setIsLoading(true);
      fetchNotes(selectedChapterId)
        .then((nts) => setNotes(nts))
        .finally(() => setIsLoading(false));
    }
  }, [selectedChapterId]);

  // Fetch note detail
  useEffect(() => {
    if (selectedNoteId !== null) {
      setIsLoading(true);
      fetchNoteById(selectedNoteId)
        .then((detail) => setCurrentNoteDetail(detail))
        .finally(() => setIsLoading(false));
    } else {
      setCurrentNoteDetail(null);
    }
  }, [selectedNoteId]);

  // Navigation handlers
  const handleGoHome = () => {
    setSelectedCourseId(null);
    setSelectedChapterId(null);
    setSelectedNoteId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToCourse = () => {
    setSelectedChapterId(null);
    setSelectedNoteId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToChapter = () => {
    setSelectedNoteId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Open /admin URL
  const handleNavigateToAdmin = () => {
    try {
      window.history.pushState(null, '', '/admin');
    } catch (e) {
      window.location.hash = '#admin';
    }
    setIsAdminRoute(true);
  };

  // Exit admin portal back to student home
  const handleExitAdmin = () => {
    try {
      window.history.pushState(null, '', '/');
    } catch (e) {
      window.location.hash = '';
    }
    setIsAdminRoute(false);
    refreshCurrentView();
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedChapter = chapters.find((ch) => ch.id === selectedChapterId);

  // Filter courses strictly based on student permissions
  const allowedCourses = useMemo(() => {
    if (!studentSession) return courses;
    const sessionCourseIds =
      studentSession.course_ids && studentSession.course_ids.length > 0
        ? studentSession.course_ids
        : studentSession.course_id === 'all'
        ? ['all']
        : studentSession.course_id
        ? [studentSession.course_id]
        : ['all'];

    if (sessionCourseIds.includes('all')) {
      return courses;
    }

    return courses.filter((c) => sessionCourseIds.includes(String(c.id)));
  }, [courses, studentSession]);

  // Security guard: If a course is selected that the student is NOT permitted to view, reset to home
  useEffect(() => {
    if (selectedCourseId !== null && courses.length > 0) {
      const isPermitted = allowedCourses.some((c) => c.id === selectedCourseId);
      if (!isPermitted) {
        setSelectedCourseId(null);
        setSelectedChapterId(null);
        setSelectedNoteId(null);
      }
    }
  }, [selectedCourseId, allowedCourses, courses.length]);

  // If currently navigating to Admin route
  if (isAdminRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
        {adminUser ? (
          <AdminPanel
            onClose={handleExitAdmin}
            onRefreshData={refreshCurrentView}
          />
        ) : (
          <AdminAuth
            onSuccess={() => {
              const session = localStorage.getItem('kics_admin_session_v1');
              if (session) {
                try {
                  setAdminUser(JSON.parse(session));
                } catch {
                  setAdminUser({ email: 'mradityapathak53@gmail.com' });
                }
              } else if (auth.currentUser) {
                setAdminUser(auth.currentUser);
              }
            }}
            onCancel={handleExitAdmin}
          />
        )}
      </div>
    );
  }

  // If student is NOT logged in, show the student login page
  if (!studentSession) {
    return (
      <StudentAuth
        onLoginSuccess={handleStudentLoginSuccess}
        onOpenAdminAuth={handleNavigateToAdmin}
        terminationNotice={sessionNotice}
      />
    );
  }

  // Student is authenticated: render learning portal
  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] text-[#333] font-sans antialiased selection:bg-[#5f90eb]/20 selection:text-[#0d47a1]">
      {/* Top Institute Header with Student Session & Logout */}
      <Navbar
        onHomeClick={handleGoHome}
        isAdminLoggedIn={!!adminUser}
        onOpenAdmin={handleNavigateToAdmin}
        studentSession={studentSession}
        onStudentLogout={handleStudentLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#5f90eb]" />
            <span className="text-sm font-medium">Loading curriculum...</span>
          </div>
        )}

        {!isLoading && selectedNoteId && currentNoteDetail && (
          <NoteDetail
            note={currentNoteDetail.note}
            chapter={currentNoteDetail.chapter}
            course={currentNoteDetail.course}
            chapterNotes={notes}
            onSelectNote={(noteId) => {
              setSelectedNoteId(noteId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBack={handleBackToChapter}
            onBackToCourse={handleBackToCourse}
            onBackToHome={handleGoHome}
          />
        )}

        {!isLoading && !selectedNoteId && selectedChapterId && selectedChapter && (
          <ChapterDetail
            chapter={selectedChapter}
            notes={notes}
            onBack={handleBackToCourse}
            onSelectNote={(noteId) => {
              setSelectedNoteId(noteId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {!isLoading && !selectedNoteId && !selectedChapterId && selectedCourseId && selectedCourse && (
          <CourseDetail
            course={selectedCourse}
            chapters={chapters}
            onBack={handleGoHome}
            onSelectChapter={(chapterId) => {
              setSelectedChapterId(chapterId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {!isLoading && !selectedNoteId && !selectedChapterId && !selectedCourseId && (
          <CourseList
            courses={allowedCourses}
            studentSession={studentSession}
            totalInstituteCourses={courses.length}
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Institute Footer with discrete staff link */}
      <Footer onAdminClick={handleNavigateToAdmin} />
    </div>
  );
}
