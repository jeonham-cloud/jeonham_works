import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Notification, TaskRequest } from '../types';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { apiCall } from '../lib/googleApi';

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (userId: string, message: string, requestId?: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children, requests }: { children: ReactNode; requests: TaskRequest[] }) {
  const { currentUser } = useAuth();
  const { systemSettings } = useSettings();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // 알림 가져오기
  const refreshNotifications = useCallback(async () => {
    if (!currentUser || !systemSettings.showNotifications) {
      setNotifications([]);
      return;
    }

    try {
      const result = await apiCall<{ data: Notification[] }>('getNotifications', {
        userId: currentUser.id,
      });
      setNotifications(result.data);
    } catch (e) {
      console.error('알림 로드 실패:', e);
    }
  }, [currentUser?.id, systemSettings.showNotifications]);

  // 초기 로드 + 주기적 폴링 (30초)
  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 30000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const addNotification = async (userId: string, message: string, requestId?: string) => {
    if (!systemSettings.showNotifications) return;

    try {
      await apiCall('addNotification', {
        userId,
        message,
        requestId: requestId || '',
      });

      // 현재 사용자에게 보내는 알림이면 즉시 새로고침
      if (userId === currentUser?.id) {
        await refreshNotifications();
      }
    } catch (e) {
      console.error('알림 추가 실패:', e);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiCall('markAsRead', { notificationId });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (e) {
      console.error('알림 읽음 처리 실패:', e);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;
    try {
      await apiCall('markAllAsRead', { userId: currentUser.id });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error('전체 읽음 처리 실패:', e);
    }
  };

  // 마감일 체크 (로컬에서 처리)
  useEffect(() => {
    if (!currentUser || !systemSettings.showNotifications) return;

    const checkDeadlines = () => {
      const now = new Date();
      requests.forEach(req => {
        if (!req.dueDate || !req.assignee) return;
        if (req.status === 'completed' || req.status === 'approved' || req.status === 'rejected') return;

        const due = new Date(req.dueDate);
        due.setHours(23, 59, 59, 999);

        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (currentUser.id !== req.assignee.id) return;

        if (diffDays >= 0 && diffDays <= 2) {
          const cacheKey = `${req.id}-imminent-${diffDays}`;
          const isNotified = localStorage.getItem(`notified-${cacheKey}`);
          if (!isNotified) {
            localStorage.setItem(`notified-${cacheKey}`, 'true');
            addNotification(
              req.assignee!.id,
              `[${req.title}] 요청 마감일이 ${diffDays === 0 ? '오늘' : `${diffDays}일 후`}입니다!`,
              req.id
            );
          }
        } else if (diffDays < 0) {
          const cacheKey = `${req.id}-overdue`;
          const isNotified = localStorage.getItem(`notified-${cacheKey}`);
          if (!isNotified) {
            localStorage.setItem(`notified-${cacheKey}`, 'true');
            addNotification(
              req.assignee!.id,
              `[${req.title}] 업무 마감일이 지났습니다! (지연)`,
              req.id
            );
          }
        }
      });
    };

    checkDeadlines();
  }, [currentUser, requests, systemSettings.showNotifications]);

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      markNotificationAsRead,
      markAllAsRead,
      refreshNotifications,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
}
