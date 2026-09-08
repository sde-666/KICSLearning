import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Course, Chapter, Note, Student } from '../types';
import rawCourses from '../data/courses.json';
import rawChapters from '../data/chapters.json';
import rawNotes from '../data/notes.json';

// Normalize base data from initial SQLite export
const baseCourses: Course[] = (rawCourses as any[]).map((c) => ({
  id: Number(c.id),
  title: c.title,
  description: c.description || '',
  is_visible: Boolean(c.is_visible),
}));

const baseChapters: Chapter[] = (rawChapters as any[]).map((ch) => ({
  id: Number(ch.id),
  course_id: Number(ch.course_id),
  title: ch.title,
  order: Number(ch.order) || 0,
  is_visible: Boolean(ch.is_visible),
}));

const baseNotes: Note[] = (rawNotes as any[]).map((n) => ({
  id: Number(n.id),
  chapter_id: Number(n.chapter_id),
  title: n.title,
  topic_number: Number(n.topic_number) || 1,
  content: n.content || '',
  file: n.file || null,
  publish_date: n.publish_date || '',
  is_visible: Boolean(n.is_visible),
}));

// Local storage keys for overrides & additions
const STORAGE_KEYS = {
  COURSES: 'kics_custom_courses_v2',
  CHAPTERS: 'kics_custom_chapters_v2',
  NOTES: 'kics_custom_notes_v2',
  DELETED_COURSES: 'kics_deleted_courses_v2',
  DELETED_CHAPTERS: 'kics_deleted_chapters_v2',
  DELETED_NOTES: 'kics_deleted_notes_v2',
  STUDENTS: 'kics_custom_students_v1',
};

function getStoredList<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setStoredList<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn('Storage quota warning:', e);
  }
}

/**
 * Tests direct write and read connectivity to the active Firestore instance.
 */
export async function testFirestoreConnection(): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const testDoc = doc(db, 'system', 'connection_test');
    await setDoc(testDoc, {
      testAt: new Date().toISOString(),
      projectId: 'learningportal-32ef9',
    });
    return {
      success: true,
      message: 'Connection successful! Cloud Firestore is active, writable, and responsive in learningportal-32ef9.',
    };
  } catch (err: any) {
    console.error('Firestore connection test error:', err);
    let errorMsg = err.message || String(err);
    if (err.code === 'permission-denied' || errorMsg.includes('permission-denied')) {
      errorMsg = 'Permission Denied: Firestore security rules in learningportal-32ef9 blocked the write. Rules need to allow read/write.';
    } else if (err.code === 'not-found' || errorMsg.includes('not-found') || errorMsg.includes('database (default) does not exist')) {
      errorMsg = 'Database Does Not Exist: Cloud Firestore has not been created yet in your Firebase Console for project learningportal-32ef9. Go to Firebase Console > Build > Firestore Database, and click "Create database".';
    }
    return {
      success: false,
      code: err.code,
      message: errorMsg,
    };
  }
}

/**
 * Force uploads and syncs ALL courses, chapters, and 240+ lecture notes
 * directly into the active Firebase Firestore project (learningportal-32ef9).
 */
export async function forceSyncAllToFirestore(
  onProgress?: (status: string, current: number, total: number) => void
): Promise<{ courses: number; chapters: number; notes: number }> {
  // Test connection first
  onProgress?.('Verifying Firestore connection to learningportal-32ef9...', 0, 100);
  const conn = await testFirestoreConnection();
  if (!conn.success) {
    throw new Error(conn.message);
  }

  // Use complete in-memory syllabus datasets + local additions
  const customCourses = getStoredList<Record<number, Course>>(STORAGE_KEYS.COURSES, {});
  const deletedCourseIds = new Set<number>(getStoredList<number[]>(STORAGE_KEYS.DELETED_COURSES, []));
  const coursesMap: Record<number, Course> = {};
  baseCourses.forEach((c) => {
    if (!deletedCourseIds.has(c.id)) coursesMap[c.id] = c;
  });
  Object.values(customCourses).forEach((c) => {
    if (!deletedCourseIds.has(c.id)) coursesMap[c.id] = c;
  });
  const allCourses = Object.values(coursesMap);

  const customChapters = getStoredList<Record<number, Chapter>>(STORAGE_KEYS.CHAPTERS, {});
  const deletedChapterIds = new Set<number>(getStoredList<number[]>(STORAGE_KEYS.DELETED_CHAPTERS, []));
  const chaptersMap: Record<number, Chapter> = {};
  baseChapters.forEach((ch) => {
    if (!deletedChapterIds.has(ch.id)) chaptersMap[ch.id] = ch;
  });
  Object.values(customChapters).forEach((ch) => {
    if (!deletedChapterIds.has(ch.id)) chaptersMap[ch.id] = ch;
  });
  const allChapters = Object.values(chaptersMap);

  const customNotes = getStoredList<Record<number, Note>>(STORAGE_KEYS.NOTES, {});
  const deletedNoteIds = new Set<number>(getStoredList<number[]>(STORAGE_KEYS.DELETED_NOTES, []));
  const notesMap: Record<number, Note> = {};
  baseNotes.forEach((n) => {
    if (!deletedNoteIds.has(n.id)) notesMap[n.id] = n;
  });
  Object.values(customNotes).forEach((n) => {
    if (!deletedNoteIds.has(n.id)) notesMap[n.id] = n;
  });
  const allNotes = Object.values(notesMap);

  const totalItems = allCourses.length + allChapters.length + allNotes.length;
  let processed = 0;

  // 1. Upload Courses
  onProgress?.(`Uploading ${allCourses.length} Courses to Firebase...`, processed, totalItems);
  for (const c of allCourses) {
    await setDoc(doc(db, 'courses', String(c.id)), c);
    processed++;
    onProgress?.(`Uploaded Course: ${c.title}`, processed, totalItems);
  }

  // 2. Upload Chapters
  onProgress?.(`Uploading ${allChapters.length} Chapters/Units to Firebase...`, processed, totalItems);
  for (const ch of allChapters) {
    await setDoc(doc(db, 'chapters', String(ch.id)), ch);
    processed++;
    onProgress?.(`Uploaded Chapter: ${ch.title}`, processed, totalItems);
  }

  // 3. Upload Notes in Batches of 50
  onProgress?.(`Uploading ${allNotes.length} Lecture Notes to Firebase...`, processed, totalItems);
  const chunkSize = 50;
  for (let i = 0; i < allNotes.length; i += chunkSize) {
    const batch = writeBatch(db);
    const chunk = allNotes.slice(i, i + chunkSize);
    for (const note of chunk) {
      batch.set(doc(db, 'notes', String(note.id)), note);
    }
    await batch.commit();
    processed += chunk.length;
    onProgress?.(
      `Uploaded ${Math.min(processed - allCourses.length - allChapters.length, allNotes.length)} / ${allNotes.length} Notes to Firebase...`,
      processed,
      totalItems
    );
  }

  // Record metadata doc
  try {
    await setDoc(doc(db, 'system', 'metadata'), {
      lastSyncedAt: new Date().toISOString(),
      projectId: 'learningportal-32ef9',
      totalCourses: allCourses.length,
      totalChapters: allChapters.length,
      totalNotes: allNotes.length,
    });
  } catch (e) {
    console.warn('Metadata save notice:', e);
  }

  onProgress?.('All content successfully uploaded to your Firebase!', totalItems, totalItems);

  return {
    courses: allCourses.length,
    chapters: allChapters.length,
    notes: allNotes.length,
  };
}

/**
 * Initializes Firestore collections with existing data if empty.
 */
export async function seedFirestoreIfEmpty(): Promise<boolean> {
  try {
    const coursesSnapshot = await getDocs(collection(db, 'courses'));
    if (!coursesSnapshot.empty) {
      return false; // Already seeded in Cloud Firestore
    }

    console.log('Seeding initial courses, chapters, and notes to Firestore...');
    for (const c of baseCourses) {
      await setDoc(doc(db, 'courses', String(c.id)), c);
    }

    for (const ch of baseChapters) {
      await setDoc(doc(db, 'chapters', String(ch.id)), ch);
    }

    const chunkSize = 50;
    for (let i = 0; i < baseNotes.length; i += chunkSize) {
      const batch = writeBatch(db);
      const chunk = baseNotes.slice(i, i + chunkSize);
      for (const n of chunk) {
        const ref = doc(db, 'notes', String(n.id));
        batch.set(ref, n);
      }
      await batch.commit();
    }
    console.log('Successfully seeded Firestore with complete learning portal data!');
    return true;
  } catch (err) {
    console.warn('Firestore cloud seed notice (local cache active):', err);
    return false;
  }
}

/**
 * Fetch all Courses from Firestore with fallback & storage synchronization
 */
export async function fetchCourses(): Promise<Course[]> {
  const deletedIds = new Set<number>(getStoredList<number[]>(STORAGE_KEYS.DELETED_COURSES, []));
  const customOverrides = getStoredList<Record<number, Course>>(STORAGE_KEYS.COURSES, {});

  try {
    const snap = await getDocs(collection(db, 'courses'));
    if (!snap.empty) {
      const list: Course[] = [];
      snap.forEach((d) => {
        const data = d.data() as Course;
        if (!deletedIds.has(data.id)) {
          list.push(customOverrides[data.id] || data);
        }
      });
      // Also add any purely local additions
      Object.values(customOverrides).forEach((c) => {
        if (!list.some((existing) => existing.id === c.id) && !deletedIds.has(c.id)) {
          list.push(c);
        }
      });
      list.sort((a, b) => a.id - b.id);
      return list;
    }
  } catch (e) {
    console.warn('Cloud fetch notice (using stored cache):', e);
  }

  // Merge base courses with local custom overrides and deletions
  const map: Record<number, Course> = {};
  baseCourses.forEach((c) => {
    if (!deletedIds.has(c.id)) {
      map[c.id] = { ...c };
    }
  });
  Object.values(customOverrides).forEach((c) => {
    if (!deletedIds.has(c.id)) {
      map[c.id] = c;
    }
  });

  return Object.values(map).sort((a, b) => a.id - b.id);
}

/**
 * Fetch all Chapters or filter by Course
 */
export async function fetchChapters(courseId?: number): Promise<Chapter[]> {
  const deletedIds = new Set<number>(getStoredList<number[]>(STORAGE_KEYS.DELETED_CHAPTERS, []));
  const customOverrides = getStoredList<Record<number, Chapter>>(STORAGE_KEYS.CHAPTERS, {});

  try {
    const snap = await getDocs(collection(db, 'chapters'));
    if (!snap.empty) {
      const list: Chapter[] = [];
      snap.forEach((d) => {
        const data = d.data() as Chapter;
        if (!deletedIds.has(data.id)) {
          const resolved = customOverrides[data.id] || data;
          if (courseId === undefined || resolved.course_id === courseId) {
            list.push(resolved);
          }
        }
      });
      Object.values(customOverrides).forEach((ch) => {
        if (
          !list.some((existing) => existing.id === ch.id) &&
          !deletedIds.has(ch.id) &&
          (courseId === undefined || ch.course_id === courseId)
        ) {
          list.push(ch);
        }
      });
      list.sort((a, b) => (a.order || 0) - (b.order || 0) || a.id - b.id);
      return list;
    }
  } catch (e) {
    console.warn('Chapters cloud notice:', e);
  }

  const map: Record<number, Chapter> = {};
  baseChapters.forEach((ch) => {
    if (!deletedIds.has(ch.id) && (courseId === undefined || ch.course_id === courseId)) {
      map[ch.id] = { ...ch };
    }
  });
  Object.values(customOverrides).forEach((ch) => {
    if (!deletedIds.has(ch.id) && (courseId === undefined || ch.course_id === courseId)) {
      map[ch.id] = ch;
    }
  });

  return Object.values(map).sort((a, b) => (a.order || 0) - (b.order || 0) || a.id - b.id);
}

/**
 * Fetch Notes by chapter or all notes
 */
export async function fetchNotes(chapterId?: number): Promise<Note[]> {
  const deletedIds = new Set<number>(getStoredList<number[]>(STORAGE_KEYS.DELETED_NOTES, []));
  const customOverrides = getStoredList<Record<number, Note>>(STORAGE_KEYS.NOTES, {});

  try {
    const snap = await getDocs(collection(db, 'notes'));
    if (!snap.empty) {
      const list: Note[] = [];
      snap.forEach((d) => {
        const data = d.data() as Note;
        if (!deletedIds.has(data.id)) {
          const resolved = customOverrides[data.id] || data;
          if (chapterId === undefined || resolved.chapter_id === chapterId) {
            list.push(resolved);
          }
        }
      });
      Object.values(customOverrides).forEach((n) => {
        if (
          !list.some((existing) => existing.id === n.id) &&
          !deletedIds.has(n.id) &&
          (chapterId === undefined || n.chapter_id === chapterId)
        ) {
          list.push(n);
        }
      });
      list.sort((a, b) => {
        if (a.publish_date !== b.publish_date) {
          return (b.publish_date || '').localeCompare(a.publish_date || '');
        }
        return (a.topic_number || 0) - (b.topic_number || 0);
      });
      return list;
    }
  } catch (e) {
    console.warn('Notes cloud notice:', e);
  }

  const map: Record<number, Note> = {};
  baseNotes.forEach((n) => {
    if (!deletedIds.has(n.id) && (chapterId === undefined || n.chapter_id === chapterId)) {
      map[n.id] = { ...n };
    }
  });
  Object.values(customOverrides).forEach((n) => {
    if (!deletedIds.has(n.id) && (chapterId === undefined || n.chapter_id === chapterId)) {
      map[n.id] = n;
    }
  });

  return Object.values(map).sort((a, b) => {
    if (a.publish_date !== b.publish_date) {
      return (b.publish_date || '').localeCompare(a.publish_date || '');
    }
    return (a.topic_number || 0) - (b.topic_number || 0);
  });
}

/**
 * Fetch a single note by ID along with its parent Chapter and Course
 */
export async function fetchNoteById(
  noteId: number
): Promise<{ note: Note; chapter?: Chapter; course?: Course } | null> {
  const allNotes = await fetchNotes();
  const note = allNotes.find((n) => n.id === noteId);
  if (!note) return null;

  const allChapters = await fetchChapters();
  const chapter = allChapters.find((c) => c.id === note.chapter_id);

  const allCourses = await fetchCourses();
  const course = chapter ? allCourses.find((co) => co.id === chapter.course_id) : undefined;

  return { note, chapter, course };
}

// ----------------------------------------------------
// Admin CRUD Operations (Courses, Chapters, Notes)
// ----------------------------------------------------

function ensureAdminAuthenticated() {
  if (!auth.currentUser) {
    throw new Error(
      'Authentication required: You must be logged into Firebase as an administrator to modify portal content.'
    );
  }
}

/**
 * Save (Create or Update) Course
 */
export async function saveCourse(data: {
  id?: number;
  title: string;
  description: string;
  is_visible: boolean;
}): Promise<Course> {
  ensureAdminAuthenticated();
  const courseId = data.id || Date.now();
  const course: Course = {
    id: courseId,
    title: data.title.trim(),
    description: data.description.trim(),
    is_visible: data.is_visible,
  };

  // Local storage save
  const customOverrides = getStoredList<Record<number, Course>>(STORAGE_KEYS.COURSES, {});
  customOverrides[courseId] = course;
  setStoredList(STORAGE_KEYS.COURSES, customOverrides);

  // Firestore save
  try {
    await setDoc(doc(db, 'courses', String(courseId)), course);
  } catch (err) {
    console.warn('Firestore course save notice:', err);
  }

  return course;
}

/**
 * Delete Course (and optionally cascade)
 */
export async function deleteCourse(courseId: number): Promise<void> {
  ensureAdminAuthenticated();
  const deletedIds = getStoredList<number[]>(STORAGE_KEYS.DELETED_COURSES, []);
  if (!deletedIds.includes(courseId)) {
    deletedIds.push(courseId);
    setStoredList(STORAGE_KEYS.DELETED_COURSES, deletedIds);
  }

  const customOverrides = getStoredList<Record<number, Course>>(STORAGE_KEYS.COURSES, {});
  delete customOverrides[courseId];
  setStoredList(STORAGE_KEYS.COURSES, customOverrides);

  try {
    await deleteDoc(doc(db, 'courses', String(courseId)));
  } catch (err) {
    console.warn('Firestore delete course notice:', err);
  }
}

/**
 * Save (Create or Update) Chapter / Unit
 */
export async function saveChapter(data: {
  id?: number;
  course_id: number;
  title: string;
  order: number;
  is_visible: boolean;
}): Promise<Chapter> {
  ensureAdminAuthenticated();
  const chapterId = data.id || Date.now();
  const chapter: Chapter = {
    id: chapterId,
    course_id: Number(data.course_id),
    title: data.title.trim(),
    order: Number(data.order) || 0,
    is_visible: data.is_visible,
  };

  const customOverrides = getStoredList<Record<number, Chapter>>(STORAGE_KEYS.CHAPTERS, {});
  customOverrides[chapterId] = chapter;
  setStoredList(STORAGE_KEYS.CHAPTERS, customOverrides);

  try {
    await setDoc(doc(db, 'chapters', String(chapterId)), chapter);
  } catch (err) {
    console.warn('Firestore chapter save notice:', err);
  }

  return chapter;
}

/**
 * Delete Chapter
 */
export async function deleteChapter(chapterId: number): Promise<void> {
  ensureAdminAuthenticated();
  const deletedIds = getStoredList<number[]>(STORAGE_KEYS.DELETED_CHAPTERS, []);
  if (!deletedIds.includes(chapterId)) {
    deletedIds.push(chapterId);
    setStoredList(STORAGE_KEYS.DELETED_CHAPTERS, deletedIds);
  }

  const customOverrides = getStoredList<Record<number, Chapter>>(STORAGE_KEYS.CHAPTERS, {});
  delete customOverrides[chapterId];
  setStoredList(STORAGE_KEYS.CHAPTERS, customOverrides);

  try {
    await deleteDoc(doc(db, 'chapters', String(chapterId)));
  } catch (err) {
    console.warn('Firestore delete chapter notice:', err);
  }
}

/**
 * Save (Create or Update) Note / Lecture
 */
export async function saveNote(data: {
  id?: number;
  chapter_id: number;
  title: string;
  topic_number?: number;
  content: string;
  file?: string | null;
  publish_date?: string;
  is_visible: boolean;
}): Promise<Note> {
  ensureAdminAuthenticated();
  const noteId = data.id || Date.now();

  // If topic_number isn't specified, calculate default
  let topicNum = data.topic_number;
  if (!topicNum) {
    const existing = await fetchNotes(data.chapter_id);
    const maxNum = existing.reduce((max, n) => Math.max(max, n.topic_number || 0), 0);
    topicNum = maxNum + 1;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const note: Note = {
    id: noteId,
    chapter_id: Number(data.chapter_id),
    title: data.title.trim(),
    topic_number: Number(topicNum) || 1,
    content: data.content,
    file: data.file || null,
    publish_date: data.publish_date || todayStr,
    is_visible: data.is_visible,
  };

  const customOverrides = getStoredList<Record<number, Note>>(STORAGE_KEYS.NOTES, {});
  customOverrides[noteId] = note;
  setStoredList(STORAGE_KEYS.NOTES, customOverrides);

  try {
    await setDoc(doc(db, 'notes', String(noteId)), note);
  } catch (err) {
    console.warn('Firestore note save notice:', err);
  }

  return note;
}

/**
 * Delete Note
 */
export async function deleteNote(noteId: number): Promise<void> {
  ensureAdminAuthenticated();
  const deletedIds = getStoredList<number[]>(STORAGE_KEYS.DELETED_NOTES, []);
  if (!deletedIds.includes(noteId)) {
    deletedIds.push(noteId);
    setStoredList(STORAGE_KEYS.DELETED_NOTES, deletedIds);
  }

  const customOverrides = getStoredList<Record<number, Note>>(STORAGE_KEYS.NOTES, {});
  delete customOverrides[noteId];
  setStoredList(STORAGE_KEYS.NOTES, customOverrides);

  try {
    await deleteDoc(doc(db, 'notes', String(noteId)));
  } catch (err) {
    console.warn('Firestore delete note notice:', err);
  }
}

/**
 * Quick toggle note visibility
 */
export async function toggleNoteVisibility(noteId: number, currentVisibility: boolean): Promise<boolean> {
  ensureAdminAuthenticated();
  const nextVal = !currentVisibility;
  const customOverrides = getStoredList<Record<number, Note>>(STORAGE_KEYS.NOTES, {});

  // Find note
  const allNotes = await fetchNotes();
  const found = allNotes.find((n) => n.id === noteId);
  if (found) {
    found.is_visible = nextVal;
    customOverrides[noteId] = found;
    setStoredList(STORAGE_KEYS.NOTES, customOverrides);
  }

  try {
    const noteRef = doc(db, 'notes', String(noteId));
    await updateDoc(noteRef, { is_visible: nextVal });
  } catch (e) {
    console.warn('Cloud visibility update notice:', e);
  }

  return nextVal;
}

// ----------------------------------------------------
// Student Management & Single-Session Auth Operations
// ----------------------------------------------------

/**
 * Helper to normalize student course_ids across legacy and new formats
 */
export function normalizeStudentCourseIds(s: Partial<Student> | any): string[] {
  if (Array.isArray(s?.course_ids) && s.course_ids.length > 0) {
    return s.course_ids;
  }
  if (s?.course_id === 'all' || !s?.course_id) {
    return ['all'];
  }
  return [String(s.course_id)];
}

/**
 * Fetch all institute students (reads from Firestore, with local cache fallback)
 */
export async function fetchStudents(): Promise<Student[]> {
  const localStudents = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});

  try {
    const snap = await getDocs(collection(db, 'students'));
    if (!snap.empty) {
      const list: Student[] = [];
      snap.forEach((d) => {
        const s = d.data() as Student;
        s.course_ids = normalizeStudentCourseIds(s);
        list.push(s);
        localStudents[s.id.toUpperCase()] = s;
      });
      setStoredList(STORAGE_KEYS.STUDENTS, localStudents);
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (e) {
    console.warn('Firestore fetchStudents notice:', e);
  }

  // Purge obsolete demo test student if present
  if (localStudents['KICS-101']) {
    delete localStudents['KICS-101'];
    setStoredList(STORAGE_KEYS.STUDENTS, localStudents);
    try {
      deleteDoc(doc(db, 'students', 'KICS-101')).catch(() => {});
    } catch {
      // ignore
    }
  }

  return Object.values(localStudents)
    .map((s) => ({ ...s, course_ids: normalizeStudentCourseIds(s) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Save (Create or Update) Student in Admin Panel
 */
export async function saveStudent(data: {
  id: string;
  name: string;
  password: string;
  course_id?: string;
  course_ids?: string[];
  phone?: string;
  is_active: boolean;
}): Promise<Student> {
  ensureAdminAuthenticated();
  const cleanId = data.id.trim().toUpperCase();
  if (!cleanId) throw new Error('Student ID / Roll number is required.');
  if (!data.name.trim()) throw new Error('Student name is required.');
  if (!data.password.trim()) throw new Error('Password is required.');

  // Normalize course_ids array
  let normalizedCourseIds: string[] = ['all'];
  if (Array.isArray(data.course_ids) && data.course_ids.length > 0) {
    normalizedCourseIds = data.course_ids;
  } else if (data.course_id) {
    normalizedCourseIds = data.course_id === 'all' ? ['all'] : [data.course_id];
  }

  const existingLocal = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
  const prevStudent = existingLocal[cleanId];

  const student: Student = {
    id: cleanId,
    name: data.name.trim(),
    password: data.password.trim(),
    course_id: normalizedCourseIds.includes('all') ? 'all' : normalizedCourseIds[0] || 'all',
    course_ids: normalizedCourseIds,
    phone: data.phone?.trim() || '',
    is_active: data.is_active,
    active_session_token: prevStudent?.active_session_token || null,
    last_login_at: prevStudent?.last_login_at || null,
    last_login_device: prevStudent?.last_login_device || null,
    created_at: prevStudent?.created_at || new Date().toISOString(),
  };

  existingLocal[cleanId] = student;
  setStoredList(STORAGE_KEYS.STUDENTS, existingLocal);

  try {
    await setDoc(doc(db, 'students', cleanId), student);
  } catch (e) {
    console.warn('Cloud saveStudent notice:', e);
  }

  return student;
}

/**
 * Delete a student record
 */
export async function deleteStudent(studentId: string): Promise<void> {
  ensureAdminAuthenticated();
  const cleanId = studentId.trim().toUpperCase();
  const existingLocal = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
  delete existingLocal[cleanId];
  setStoredList(STORAGE_KEYS.STUDENTS, existingLocal);

  try {
    await deleteDoc(doc(db, 'students', cleanId));
  } catch (e) {
    console.warn('Cloud deleteStudent notice:', e);
  }
}

/**
 * Toggle Student Active Status
 */
export async function toggleStudentStatus(studentId: string, currentStatus: boolean): Promise<boolean> {
  ensureAdminAuthenticated();
  const cleanId = studentId.trim().toUpperCase();
  const nextStatus = !currentStatus;
  const existingLocal = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
  if (existingLocal[cleanId]) {
    existingLocal[cleanId].is_active = nextStatus;
    // If deactivating, kill any active session token
    if (!nextStatus) {
      existingLocal[cleanId].active_session_token = null;
    }
    setStoredList(STORAGE_KEYS.STUDENTS, existingLocal);
  }

  try {
    const studentRef = doc(db, 'students', cleanId);
    await updateDoc(studentRef, {
      is_active: nextStatus,
      ...(nextStatus ? {} : { active_session_token: null }),
    });
  } catch (e) {
    console.warn('Cloud toggleStudentStatus notice:', e);
  }

  return nextStatus;
}

/**
 * Force logout a student across all devices
 */
export async function forceLogoutStudent(studentId: string): Promise<void> {
  ensureAdminAuthenticated();
  const cleanId = studentId.trim().toUpperCase();
  const existingLocal = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
  if (existingLocal[cleanId]) {
    existingLocal[cleanId].active_session_token = null;
    setStoredList(STORAGE_KEYS.STUDENTS, existingLocal);
  }

  try {
    const studentRef = doc(db, 'students', cleanId);
    await updateDoc(studentRef, { active_session_token: null });
  } catch (e) {
    console.warn('Cloud forceLogoutStudent notice:', e);
  }
}

/**
 * Student Login with Single-Device / Single-Session Enforcement
 */
export async function loginStudent(
  studentId: string,
  plainPassword: string
): Promise<{ success: boolean; student?: Student; sessionToken?: string; message?: string }> {
  const cleanId = studentId.trim().toUpperCase();
  if (!cleanId || !plainPassword) {
    return { success: false, message: 'Please enter both Student ID and Password.' };
  }

  let student: Student | null = null;

  // Check Firestore first
  try {
    const studentDoc = await getDoc(doc(db, 'students', cleanId));
    if (studentDoc.exists()) {
      student = studentDoc.data() as Student;
    }
  } catch (e) {
    console.warn('Firestore student lookup notice:', e);
  }

  // Fallback to local storage if Firestore lookup didn't find or errored
  if (!student) {
    const localStudents = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
    student = localStudents[cleanId] || null;
  }

  if (!student) {
    return {
      success: false,
      message: 'Invalid Student ID. No student registered with this ID by the institute.',
    };
  }

  if (!student.is_active) {
    return {
      success: false,
      message: 'Your student account has been deactivated. Please contact institute faculty.',
    };
  }

  if (student.password.trim() !== plainPassword.trim()) {
    return {
      success: false,
      message: 'Incorrect Password. Please check your password or contact faculty.',
    };
  }

  // Generate new unique session token for single device restriction
  const sessionToken = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);
  const now = new Date().toISOString();
  const device = typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 80) : 'Browser';

  student.course_ids = normalizeStudentCourseIds(student);
  student.active_session_token = sessionToken;
  student.last_login_at = now;
  student.last_login_device = device;

  // Persist to local cache
  const localStudents = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
  localStudents[cleanId] = student;
  setStoredList(STORAGE_KEYS.STUDENTS, localStudents);

  // Update Firestore so any previous device with old token gets instantly invalidated
  try {
    await updateDoc(doc(db, 'students', cleanId), {
      active_session_token: sessionToken,
      last_login_at: now,
      last_login_device: device,
    });
  } catch (e) {
    // If updateDoc failed because doc didn't exist yet in firestore, create it
    try {
      await setDoc(doc(db, 'students', cleanId), student);
    } catch (err) {
      console.warn('Failed to sync session token to cloud:', err);
    }
  }

  return {
    success: true,
    student,
    sessionToken,
  };
}

/**
 * Student Logout
 */
export async function logoutStudent(studentId: string): Promise<void> {
  const cleanId = studentId.trim().toUpperCase();
  const localStudents = getStoredList<Record<string, Student>>(STORAGE_KEYS.STUDENTS, {});
  if (localStudents[cleanId]) {
    localStudents[cleanId].active_session_token = null;
    setStoredList(STORAGE_KEYS.STUDENTS, localStudents);
  }

  try {
    await updateDoc(doc(db, 'students', cleanId), {
      active_session_token: null,
    });
  } catch (e) {
    console.warn('Student cloud logout notice:', e);
  }
}

/**
 * Real-time listener for student session validity and course permissions.
 * If another user logs in with the same Student ID, the active_session_token in Firestore changes,
 * triggering an automatic, instant termination of the previous session.
 * Also notifies of updated course assignments in real time.
 */
export function listenToStudentSession(
  studentId: string,
  sessionToken: string,
  onTerminated: (reason: string) => void,
  onStudentUpdated?: (student: Student) => void
): () => void {
  const cleanId = studentId.trim().toUpperCase();

  try {
    const unsub = onSnapshot(
      doc(db, 'students', cleanId),
      (snap) => {
        if (!snap.exists()) {
          onTerminated('Your student account was removed from the institute portal.');
          return;
        }
        const raw = snap.data() as Student;
        const data: Student = {
          ...raw,
          course_ids: normalizeStudentCourseIds(raw),
        };

        if (!data.is_active) {
          onTerminated('Your student account has been deactivated by the faculty.');
          return;
        }
        if (data.active_session_token && data.active_session_token !== sessionToken) {
          onTerminated(
            'You have been logged out because your account was logged into on another device or browser. Only one active login is allowed at a time.'
          );
          return;
        }

        // Notify of real-time course access or profile updates
        if (onStudentUpdated) {
          onStudentUpdated(data);
        }
      },
      (err) => {
        console.warn('Student session listener notice:', err);
      }
    );

    return unsub;
  } catch (e) {
    console.warn('Failed to start session listener:', e);
    return () => {};
  }
}

