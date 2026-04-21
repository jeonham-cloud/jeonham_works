import { TaskRequest, User } from './types';
import { DEPARTMENTS } from './constants/texts';

export const MOCK_USERS: User[] = [
  {
    id: 'user-admin',
    email: 'admin@jeonham.org',
    name: '최고관리자',
    role: 'admin',
    department: '경영지원실',
    active: true,
    createdAt: '2024-01-01',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
  },
];

export const MOCK_REQUESTS: TaskRequest[] = [];
