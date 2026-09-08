export interface Course {
  id: number;
  title: string;
  description: string;
  is_visible: boolean;
}

export interface Chapter {
  id: number;
  course_id: number;
  title: string;
  order: number;
  is_visible: boolean;
}

export interface Note {
  id: number;
  chapter_id: number;
  title: string;
  topic_number: number;
  content: string;
  file?: string | null;
  publish_date: string;
  is_visible: boolean;
}

export interface Student {
  id: string; // Roll number or Student ID e.g., "202401"
  name: string; // Student full name
  password: string; // Plain password assigned by admin
  course_id?: string; // Legacy: 'all' or numeric course id as string
  course_ids: string[]; // List of assigned course IDs as strings, e.g. ['all'] or ['1', '2']
  phone?: string;
  is_active: boolean;
  active_session_token?: string | null;
  last_login_at?: string | null;
  last_login_device?: string | null;
  created_at: string;
}

export interface StudentSession {
  studentId: string;
  name: string;
  course_id?: string;
  course_ids: string[];
  sessionToken: string;
  loginTime: string;
}

