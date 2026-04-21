// Department is now a flexible string type to support dynamic departments
export type Department = string;

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Status = 'draft' | 'submitted' | 'reviewing' | 'rejected' | 'approved' | 'in-progress' | 'completed' | 'on-hold';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'user' | 'finance';
  department: Department;
  avatar?: string;
  active: boolean;
  createdAt: string;
}

export interface SystemSettings {
  homeScreen: 'dashboard' | 'requests';
  showNotifications: boolean;
  useLogoutConfirm: boolean;
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY';
}

export interface RolePermissionSummary {
  role: 'admin' | 'manager' | 'user' | 'finance';
  description: string;
  permissions: string[];
}

export interface Schedule {
  id: string;
  title: string;
  department: Department;
  description?: string;
  startDate: string;
  endDate: string;
  participants: string[];
  createdBy: string;
  workType: string;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  actorName: string;
  actorRole: string;
  fromStatus: Status | 'none';
  toStatus: Status;
  comment?: string;
  changedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: string;
  read: boolean;
  requestId: string;
}

export interface TaskRequest {
  id: string;
  title: string;
  description: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar?: string;
  department: Department;
  targetDepartment: Department;
  ccDepartment?: Department;
  category?: string;
  priority: Priority;
  status: Status;
  dueDate: string;
  createdAt: string;
  attachments: Attachment[];
  comments: Comment[];
  history: HistoryItem[];
  assignee: {
    id: string;
    name: string;
    department: Department;
    role: string;
  } | null;
}

export interface LunchOrder {
  id: string;
  date: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface SystemLog {
  id: string;
  actionType: 'create' | 'delete';
  entityType: 'request';
  entityId: string;
  entityTitle: string;
  actorId: string;
  actorName: string;
  createdAt: string;
  details?: string;
}
