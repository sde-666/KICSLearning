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

export interface InstituteSettings {
  instituteName: string;
  shortName: string;
  tagline: string;
  affiliationText: string;
  logoUrl: string;
  portalUrl: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  establishedYear: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroNotice?: string;
  updatedAt?: string;
}

export const DEFAULT_INSTITUTE_SETTINGS: InstituteSettings = {
  instituteName: 'Karamraji Institute of Computer Science & IT',
  shortName: 'KICS',
  tagline: 'Premier Institute for Computer Science, Information Technology & Professional Skills',
  affiliationText: 'NIELIT O-Level Authorized Learning Centre & Tech Academy',
  logoUrl: '/images/logo.jpg',
  portalUrl: 'https://kicslearning.vercel.app/',
  contactEmail: 'contact@kicslearning.edu',
  contactPhone: '+91 98765 43210',
  address: 'Main Campus, IT Park Road',
  establishedYear: '2018',
  heroBadge: '✨ Official Digital Learning Portal',
  heroTitle: 'Master Computer Science & Elevate Your Tech Future',
  heroSubtitle: 'Access comprehensive syllabus notes, interactive code units, chapter lectures, and curated exam materials tailored for your academic and career excellence.',
  heroNotice: 'New Academic Batch Notes & Practical Units Live • Access Your Modules Below',
};


