import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Smartphone,
  LogOut as ForceLogoutIcon,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Student, Course } from '../../types';
import {
  saveStudent,
  deleteStudent,
  toggleStudentStatus,
  forceLogoutStudent,
  normalizeStudentCourseIds,
} from '../../services/portalService';

interface StudentManagerProps {
  students: Student[];
  courses: Course[];
  onRefresh: () => Promise<void>;
  notify: (msg: string) => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  courses,
  onRefresh,
  notify,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student> | null>(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Password visibility map (by student ID)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle password visibility
  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Copy student login credentials to clipboard with course details
  const handleCopyCredentials = (s: Student) => {
    const isAll = s.course_ids?.includes('all') || s.course_id === 'all';
    const assignedCoursesList = isAll
      ? 'All NIELIT O-Level Modules (Full Curriculum Access)'
      : courses
          .filter((c) => s.course_ids?.includes(String(c.id)) || s.course_id === String(c.id))
          .map((c) => c.title)
          .join(', ') || 'No courses assigned';

    const text = `KICS Institute Student Login:\nStudent ID / Roll No: ${s.id}\nPassword: ${s.password}\nAllowed Courses: ${assignedCoursesList}\nPortal: https://kicslearning.vercel.app/`;
    navigator.clipboard.writeText(text);
    setCopiedId(s.id);
    notify(`Credentials for "${s.name}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const nextNumber = students.length + 1;
    const generatedId = `KICS${new Date().getFullYear().toString().slice(-2)}${String(nextNumber).padStart(3, '0')}`;
    setEditingStudent({
      id: generatedId,
      name: '',
      password: Math.random().toString(36).substring(2, 8) + '25',
      course_id: 'all',
      course_ids: ['all'],
      phone: '',
      is_active: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: Student) => {
    setEditingStudent({
      ...student,
      course_ids: normalizeStudentCourseIds(student),
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  // Toggle course checkbox in modal
  const toggleCourseInModal = (courseIdStr: string) => {
    if (!editingStudent) return;
    let current = editingStudent.course_ids || [];
    if (current.includes('all')) {
      // Transition from 'all' to all courses EXCEPT the toggled one
      current = courses.map((c) => String(c.id)).filter((id) => id !== courseIdStr);
    } else if (current.includes(courseIdStr)) {
      current = current.filter((id) => id !== courseIdStr);
    } else {
      current = [...current, courseIdStr];
    }
    setEditingStudent({
      ...editingStudent,
      course_ids: current,
      course_id: current.includes('all') ? 'all' : current[0] || '',
    });
  };

  // Save (Create or Edit)
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setModalError(null);

    const cleanId = (editingStudent.id || '').trim().toUpperCase();
    const cleanName = (editingStudent.name || '').trim();
    const cleanPass = (editingStudent.password || '').trim();

    if (!cleanId) {
      setModalError('Student ID / Roll Number is required.');
      return;
    }
    if (!cleanName) {
      setModalError('Student full name is required.');
      return;
    }
    if (!cleanPass) {
      setModalError('Password is required.');
      return;
    }

    const courseIds = editingStudent.course_ids && editingStudent.course_ids.length > 0
      ? editingStudent.course_ids
      : editingStudent.course_id === 'all'
      ? ['all']
      : editingStudent.course_id
      ? [editingStudent.course_id]
      : [];

    if (courseIds.length === 0) {
      setModalError('Please grant access to at least 1 course or select Full Access, otherwise this student will not see any courses.');
      return;
    }

    setModalSaving(true);
    try {
      await saveStudent({
        id: cleanId,
        name: cleanName,
        password: cleanPass,
        course_ids: courseIds,
        course_id: courseIds.includes('all') ? 'all' : courseIds[0] || 'all',
        phone: editingStudent.phone || '',
        is_active: editingStudent.is_active ?? true,
      });

      notify(`Student "${cleanName}" (${cleanId}) saved successfully.`);
      setIsModalOpen(false);
      setEditingStudent(null);
      await onRefresh();
    } catch (err: any) {
      console.error('Save student error:', err);
      setModalError(err.message || 'Failed to save student.');
    } finally {
      setModalSaving(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async (student: Student) => {
    if (
      !window.confirm(
        `Are you sure you want to remove student "${student.name}" (${student.id}) from the institute portal?`
      )
    ) {
      return;
    }

    try {
      await deleteStudent(student.id);
      notify(`Student "${student.name}" deleted.`);
      await onRefresh();
    } catch (err: any) {
      notify('Failed to delete student: ' + (err.message || String(err)));
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (student: Student) => {
    try {
      const nextStatus = await toggleStudentStatus(student.id, student.is_active);
      notify(`Student ${student.name} is now ${nextStatus ? 'Active' : 'Suspended'}.`);
      await onRefresh();
    } catch (err: any) {
      notify('Failed to update status: ' + (err.message || String(err)));
    }
  };

  // Force Logout Student (resets active session token)
  const handleForceLogout = async (student: Student) => {
    try {
      await forceLogoutStudent(student.id);
      notify(`Active session for ${student.name} was terminated. Student must log in again.`);
      await onRefresh();
    } catch (err: any) {
      notify('Failed to terminate session: ' + (err.message || String(err)));
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      searchTerm === '' ||
      s.name.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      (s.phone && s.phone.includes(term));

    const studentCourseIds = s.course_ids && s.course_ids.length > 0
      ? s.course_ids
      : s.course_id === 'all'
      ? ['all']
      : s.course_id
      ? [s.course_id]
      : ['all'];

    const matchCourse =
      filterCourse === 'all'
        ? true
        : filterCourse === 'full_access'
        ? studentCourseIds.includes('all')
        : studentCourseIds.includes('all') || studentCourseIds.includes(filterCourse);

    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && s.is_active) ||
      (filterStatus === 'suspended' && !s.is_active) ||
      (filterStatus === 'online' && Boolean(s.active_session_token));

    return matchSearch && matchCourse && matchStatus;
  });

  const onlineCount = students.filter((s) => Boolean(s.active_session_token)).length;
  const activeCount = students.filter((s) => s.is_active).length;

  return (
    <div className="space-y-5">
      {/* Overview Metric Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Institute Students</p>
            <p className="text-xl font-bold text-slate-900">{students.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Accounts</p>
            <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Currently Online Devices</p>
            <div className="flex items-center gap-2">
              <p className="text-xl font-bold text-indigo-600">{onlineCount}</p>
              {onlineCount > 0 && (
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Single Device Locked
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Enroll Student</p>
            <p className="text-xs text-slate-600 mt-0.5">Manual ID & Password setup</p>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={filterCourse}
            onChange={(e) => setFilterCourse(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Enrolled Students</option>
            <option value="full_access">Full Access (All Modules)</option>
            {courses.map((c) => (
              <option key={c.id} value={String(c.id)}>
                Access to: {c.title.split(':')[0] || c.title}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-hidden focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
            <option value="online">Online Devices Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No students found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {searchTerm || filterCourse !== 'all' || filterStatus !== 'all'
                ? 'No students match your current filters.'
                : 'Click "Add Student" above to enroll your institute students and generate their login IDs.'}
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Enroll First Student</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Student Name & ID</th>
                  <th className="py-3.5 px-4">Login Password</th>
                  <th className="py-3.5 px-4">Assigned Course</th>
                  <th className="py-3.5 px-4">Session & Device</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s) => {
                  const isPassVisible = visiblePasswords[s.id];
                  const isCopied = copiedId === s.id;
                  const isOnline = Boolean(s.active_session_token);
                  const assignedCourseName =
                    s.course_id === 'all'
                      ? 'All NIELIT Modules'
                      : courses.find((c) => String(c.id) === s.course_id)?.title || s.course_id;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{s.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 text-[11px] font-bold">
                                {s.id}
                              </span>
                              {s.phone && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  • {s.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Password & Credentials Copy */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-700 text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200">
                            {isPassVisible ? s.password : '••••••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(s.id)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200/50 cursor-pointer"
                            title={isPassVisible ? 'Hide Password' : 'Show Password'}
                          >
                            {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyCredentials(s)}
                            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer border ${
                              isCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                            }`}
                            title="Copy ID & Password for WhatsApp/SMS"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500" />
                                <span>Copy ID/Pass</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Assigned Course(s) */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const isAll = s.course_ids?.includes('all') || s.course_id === 'all';
                          if (isAll) {
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md text-[11px] font-semibold w-fit">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>All Modules ({courses.length})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(s)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer block"
                                >
                                  Modify Access
                                </button>
                              </div>
                            );
                          }

                          const assigned = courses.filter((c) =>
                            s.course_ids?.includes(String(c.id)) || s.course_id === String(c.id)
                          );

                          if (assigned.length === 0) {
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md text-[11px] font-semibold w-fit">
                                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                                  <span>No Access (0)</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(s)}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer block"
                                >
                                  Assign Courses
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1 max-w-[210px]">
                                {assigned.map((c) => (
                                  <span
                                    key={c.id}
                                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[130px]"
                                    title={c.title}
                                  >
                                    {c.title.split(':')[0] || c.title}
                                  </span>
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(s)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer block"
                              >
                                Edit access ({assigned.length}/{courses.length})
                              </button>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Session Status & Single Device Control */}
                      <td className="py-3.5 px-4">
                        {isOnline ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="font-semibold text-emerald-700 text-xs">Online Device</span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={s.last_login_device || 'Active Device'}>
                              {s.last_login_at
                                ? new Date(s.last_login_at).toLocaleDateString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Active session'}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleForceLogout(s)}
                              className="text-[10px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer pt-0.5"
                              title="Instantly logout this student from their active device"
                            >
                              <ForceLogoutIcon className="w-3 h-3" />
                              <span>Force Device Logout</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            <span>Offline / No Session</span>
                          </div>
                        )}
                      </td>

                      {/* Account Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(s)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                            s.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              s.is_active ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span>{s.is_active ? 'Active' : 'Suspended'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Student Information"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(s)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Student Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Enroll / Edit Student */}
      {isModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header (Fixed at top) */}
            <div className="bg-slate-900 text-white px-5 py-3.5 shrink-0 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300 shrink-0">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold tracking-tight truncate">
                    {students.some((s) => s.id === editingStudent.id)
                      ? `Edit Student: ${editingStudent.name || editingStudent.id}`
                      : 'Enroll New Institute Student'}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">
                    Set up credentials and course access for your student
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStudent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
                {modalError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-xs">{modalError}</span>
                  </div>
                )}

                {/* Row 1: Student ID & Full Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                      Student ID / Roll No *
                    </label>
                    <input
                      type="text"
                      value={editingStudent.id || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, id: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g. 202401 or Roll No"
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Must be unique for each student
                    </span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                      Student Full Name *
                    </label>
                    <input
                      type="text"
                      value={editingStudent.name || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      required
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-xs"
                    />
                  </div>
                </div>

                {/* Row 2: Password & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                        Login Password *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingStudent({
                            ...editingStudent,
                            password: Math.random().toString(36).substring(2, 8) + '25',
                          })
                        }
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={editingStudent.password || ''}
                        onChange={(e) =>
                          setEditingStudent({ ...editingStudent, password: e.target.value })
                        }
                        placeholder="Set password"
                        required
                        className="w-full pl-3 pr-8 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-xs"
                      />
                      <Key className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1 text-[11px]">
                      Phone / WhatsApp (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingStudent.phone || ''}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, phone: e.target.value })
                      }
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 text-xs"
                    />
                  </div>
                </div>

                {/* Course Access Permissions */}
                <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Course Access Permissions *</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingStudent({
                            ...editingStudent,
                            course_ids: ['all'],
                            course_id: 'all',
                          })
                        }
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingStudent({
                            ...editingStudent,
                            course_ids: [],
                            course_id: '',
                          })
                        }
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-medium hover:underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 mb-2">
                    Courses not selected here will be completely hidden from this student.
                  </p>

                  {/* Full Access Toggle Card */}
                  {(() => {
                    const isFull =
                      editingStudent.course_ids?.includes('all') ||
                      editingStudent.course_id === 'all';

                    return (
                      <div
                        onClick={() => {
                          if (isFull) {
                            setEditingStudent({
                              ...editingStudent,
                              course_ids: courses.map((c) => String(c.id)),
                              course_id: String(courses[0]?.id || '1'),
                            });
                          } else {
                            setEditingStudent({
                              ...editingStudent,
                              course_ids: ['all'],
                              course_id: 'all',
                            });
                          }
                        }}
                        className={`p-2.5 rounded-lg border transition-all cursor-pointer mb-2 flex items-center justify-between ${
                          isFull
                            ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs ring-1 ring-blue-400/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isFull}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                          />
                          <div>
                            <div className="font-bold text-xs flex items-center gap-1.5">
                              <span>Full Curriculum Access (All Modules)</span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-200 text-blue-800">
                                {courses.length} Courses
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Grant unrestricted access to all NIELIT O-Level modules and future courses.
                            </div>
                          </div>
                        </div>
                        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
                      </div>
                    );
                  })()}

                  {/* Specific Course Checkboxes */}
                  <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                    {courses.map((c) => {
                      const isFull =
                        editingStudent.course_ids?.includes('all') ||
                        editingStudent.course_id === 'all';
                      const isChecked =
                        isFull || editingStudent.course_ids?.includes(String(c.id));

                      return (
                        <label
                          key={c.id}
                          className={`flex items-start gap-2 p-2 rounded-md border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-blue-50/70 border-blue-300 text-blue-950'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isFull}
                            onChange={() => toggleCourseInModal(String(c.id))}
                            className="w-3.5 h-3.5 mt-0.5 rounded text-blue-600 focus:ring-blue-500 disabled:opacity-60 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs ${isChecked ? 'font-bold text-blue-900' : 'font-medium text-slate-800'} truncate`}>
                                {c.title}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                #{c.id}
                              </span>
                            </div>
                            {c.description && (
                              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                {c.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Selection Counter & Alerts */}
                  <div className="mt-2 pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-[10px]">
                    <span className="text-slate-600">
                      Assigned:{' '}
                      <strong className="text-blue-700 font-bold">
                        {editingStudent.course_ids?.includes('all') ||
                        editingStudent.course_id === 'all'
                          ? `All ${courses.length} Modules`
                          : `${editingStudent.course_ids?.length || 0} of ${courses.length} Modules Selected`}
                      </strong>
                    </span>

                    {(!editingStudent.course_ids || editingStudent.course_ids.length === 0) &&
                      editingStudent.course_id !== 'all' && (
                        <span className="text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>No courses selected!</span>
                        </span>
                      )}
                  </div>
                </div>

                {/* Account Active & Single Session Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingStudent.is_active ?? true}
                      onChange={(e) =>
                        setEditingStudent({ ...editingStudent, is_active: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                    />
                    <div>
                      <span className="font-semibold text-slate-800 block text-xs">Account Active</span>
                      <p className="text-[10px] text-slate-500">
                        Uncheck to immediately suspend access
                      </p>
                    </div>
                  </label>

                  <div className="p-2.5 bg-blue-50/80 rounded-lg border border-blue-200 text-blue-900 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-[10px] leading-tight">
                      <strong>Single Active Device:</strong> Logging in on another device automatically disconnects any previous session.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer (Sticky / Always visible at bottom - Never requires zooming out) */}
              <div className="shrink-0 bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500 hidden sm:block">
                  {students.some((s) => s.id === editingStudent.id)
                    ? 'Updating existing student profile'
                    : 'Credentials can be copied after saving'}
                </p>
                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-lg hover:bg-slate-200/70 transition-colors cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSaving}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs"
                  >
                    {modalSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Student...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Student Credentials</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
