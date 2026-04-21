import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDueDateStatus(dueDate: string, status: string): 'overdue' | 'imminent' | 'normal' {
  if (status === 'completed' || status === 'approved' || status === 'rejected') {
    return 'normal';
  }
  
  if (!dueDate) return 'normal';

  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  const now = new Date();
  
  if (now > due) {
    return 'overdue';
  }
  
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays <= 1) {
    return 'imminent';
  }
  return 'normal';
}
