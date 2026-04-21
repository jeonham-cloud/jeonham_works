import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Schedule, LunchOrder } from '../types';
import { apiCall } from '../lib/googleApi';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface ScheduleContextType {
  schedules: Schedule[];
  lunchOrders: LunchOrder[];
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdBy'>) => void;
  updateSchedule: (id: string, payload: Partial<Schedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleLunchOrder: (date: string) => Promise<void>;
  refreshSchedules: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [lunchOrders, setLunchOrders] = useState<LunchOrder[]>([]);

  // 데이터 로드
  const refreshSchedules = useCallback(async () => {
    try {
      const [schedulesResult, lunchResult] = await Promise.all([
        apiCall<{ data: Schedule[] }>('getSchedules'),
        apiCall<{ data: LunchOrder[] }>('getLunchOrders'),
      ]);
      setSchedules(schedulesResult.data);
      setLunchOrders(lunchResult.data);
    } catch (e) {
      console.error('일정 로드 실패:', e);
    }
  }, []);

  // 초기 로드 + 폴링
  useEffect(() => {
    refreshSchedules();
    const interval = setInterval(refreshSchedules, 60000); // 60초
    return () => clearInterval(interval);
  }, [refreshSchedules]);

  const addSchedule = async (newSch: Omit<Schedule, 'id' | 'createdBy'>) => {
    if (!currentUser) return;
    const schedule: Schedule = {
      ...newSch,
      id: `SCH-${Date.now()}`,
      createdBy: currentUser.id,
    };

    try {
      await apiCall('addSchedule', { schedule });

      // 참여자 알림
      newSch.participants.forEach(pid => {
        if (pid !== currentUser.id) {
          const time = newSch.startDate.split('T')[1]?.substring(0, 5) || '';
          addNotification(pid, `새로운 부서 일정 [${newSch.title}](${time})에 참여자로 지정되었습니다.`);
        }
      });

      await refreshSchedules();
    } catch (e: any) {
      alert('일정 등록 오류: ' + e.message);
    }
  };

  const updateSchedule = async (id: string, payload: Partial<Schedule>) => {
    const s = schedules.find(sch => sch.id === id);
    if (!s) return;

    try {
      await apiCall('updateSchedule', { scheduleId: id, updates: payload });

      // 새 참여자 알림
      const newParticipants = payload.participants?.filter(p => !s.participants.includes(p)) || [];
      newParticipants.forEach(pid => {
        if (pid !== currentUser?.id) {
          const time = (payload.startDate || s.startDate).split('T')[1]?.substring(0, 5) || '';
          addNotification(pid, `부서 일정 [${payload.title || s.title}](${time})에 참여자로 지정되었습니다.`);
        }
      });

      await refreshSchedules();
    } catch (e: any) {
      alert('일정 수정 오류: ' + e.message);
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await apiCall('deleteSchedule', { scheduleId: id });
      await refreshSchedules();
    } catch (e: any) {
      alert('일정 삭제 오류: ' + e.message);
    }
  };

  const toggleLunchOrder = async (date: string) => {
    if (!currentUser) return;

    // 마감 시간 체크: 해당일 전날 오후 3시
    const now = new Date();
    const targetDate = new Date(date);
    const deadline = new Date(targetDate);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(15, 0, 0, 0);

    if (now.getTime() > deadline.getTime()) {
      alert("신청/취소 마감 시간이 지났습니다. (해당일 전날 오후 3시 마감)");
      return;
    }

    try {
      await apiCall('toggleLunchOrder', {
        date,
        userId: currentUser.id,
        userName: currentUser.name,
      });
      await refreshSchedules();
    } catch (e: any) {
      alert('데이터 연결 오류: ' + e.message);
    }
  };

  return (
    <ScheduleContext.Provider value={{
      schedules,
      lunchOrders,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      toggleLunchOrder,
      refreshSchedules,
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (!context) throw new Error('useSchedule must be used within ScheduleProvider');
  return context;
}
