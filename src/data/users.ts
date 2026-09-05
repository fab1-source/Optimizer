import { AppUser } from '../types';

export const SYSTEM_USERS: AppUser[] = [
  {
    id: 'user1',
    name: 'User 1 (Admin)',
    role: 'admin',
    canLock: true,
    canEdit: true,
    color: '#3b82f6', // blue
  },
  {
    id: 'user2',
    name: 'User 2 (Planner)',
    role: 'planner',
    canLock: true,
    canEdit: true,
    color: '#10b981', // emerald
  },
  {
    id: 'user3',
    name: 'User 3 (Shop Floor / CNC)',
    role: 'operator',
    canLock: false,
    canEdit: false,
    color: '#f59e0b', // amber
  },
];

export const DEFAULT_ACTIVE_USER = SYSTEM_USERS[0];
