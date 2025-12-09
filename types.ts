

export enum Role {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  avatar?: string;
  groupId?: string; // ID of the group the student belongs to
  curatedGroups?: string[]; // IDs of groups the teacher curates
}

export interface Material {
  id: string;
  title: string;
  category: string;
  description: string;
  dateAdded: string;
  fileName?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  specialization: string;
  year: number;
  teacherName: string;
  reminderDate: string; // YYYY-MM-DD format from DB
  category: 'exam' | 'attention' | 'other';
  createdAt: string;
}

export interface CourseContent {
    id: string;
    courseId: string;
    title: string;
    kind: 'theory' | 'assignment';
    description: string;
    hours: number;
    teacherFile?: string;
}

export interface Course {
    id: string;
    title: string;
    duration?: string;
    totalHours?: number;
    teacherName: string;
    specialization?: string;
    year?: number;
    targetGroup?: string; // Group ID that sees this course. '0' or null means all.
    createdAt: string;
    contents?: CourseContent[];
}

export interface Enrollment {
    id: string;
    username: string;
    courseId: string;
    enrolledAt: string;
    status: 'pending' | 'active' | 'rejected';
    courseTitle?: string; // Joined field
    studentName?: string; // Joined field (from User mock or DB)
}

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'exam' | 'reminder' | 'deadline';
}

export interface ChatMessage {
    id: string;
    courseId: string;
    username: string;
    role: Role;
    text: string;
    createdAt: string;
}

export interface RoomState {
    courseId: string;
    isActive: boolean; // 1 or 0
    isChatLocked: boolean; // 1 or 0
    isScreenSharing?: boolean; // 1 or 0
}

export enum View {
  CALENDAR = 'calendar',
  COURSES = 'courses',
  COURSE_DETAILS = 'course_details',
  COURSE_ROOM = 'course_room',
  COURSE_STUDENTS = 'course_students',
  MATERIALS = 'materials',
  ADMIN = 'admin',
  PROFILE = 'profile',
  ABOUT = 'about'
}