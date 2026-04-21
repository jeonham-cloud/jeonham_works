import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SystemSettings } from '../types';
import { DEPARTMENTS } from '../constants/texts';
import { apiCall } from '../lib/googleApi';

interface SettingsContextType {
  systemSettings: SystemSettings;
  departments: string[];
  updateSystemSettings: (payload: Partial<SystemSettings>) => void;
  addDepartment: (name: string) => void;
  deleteDepartment: (name: string) => void;
  editDepartment: (oldName: string, newName: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    homeScreen: 'dashboard',
    showNotifications: true,
    useLogoutConfirm: true,
    dateFormat: 'YYYY-MM-DD',
  });
  const [loaded, setLoaded] = useState(false);

  // 설정 로드
  const loadSettings = useCallback(async () => {
    try {
      const result = await apiCall<{ data: Record<string, any> }>('getSettings');
      const data = result.data;

      if (data.departments && Array.isArray(data.departments)) {
        setDepartments(data.departments);
      }

      setSystemSettings(prev => ({
        ...prev,
        homeScreen: data.homeScreen || prev.homeScreen,
        showNotifications: data.showNotifications !== undefined ? data.showNotifications : prev.showNotifications,
        useLogoutConfirm: data.useLogoutConfirm !== undefined ? data.useLogoutConfirm : prev.useLogoutConfirm,
        dateFormat: data.dateFormat || prev.dateFormat,
      }));
    } catch (e) {
      console.error('설정 로드 실패:', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveDepartments = async (newDepts: string[]) => {
    await apiCall('updateSetting', { key: 'departments', value: newDepts });
  };

  const updateSystemSettings = async (payload: Partial<SystemSettings>) => {
    const updated = { ...systemSettings, ...payload };
    setSystemSettings(updated);

    // 각 설정 항목을 개별 저장
    for (const [key, value] of Object.entries(payload)) {
      await apiCall('updateSetting', { key, value });
    }
  };

  const addDepartment = async (name: string) => {
    if (!departments.includes(name)) {
      const newDepts = [...departments, name];
      setDepartments(newDepts);
      await saveDepartments(newDepts);
    }
  };

  const deleteDepartment = async (name: string) => {
    const newDepts = departments.filter(d => d !== name);
    setDepartments(newDepts);
    await saveDepartments(newDepts);
  };

  const editDepartment = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const newDepts = departments.map(d => d === oldName ? newName : d);
    setDepartments(newDepts);
    await saveDepartments(newDepts);

    // 사용자 및 요청의 부서 정보도 업데이트 (API 서버에서 처리하게 할 수도 있지만, 간단히 프론트에서 처리)
    try {
      const usersResult = await apiCall<{ data: any[] }>('getUsers');
      for (const user of usersResult.data) {
        if (user.department === oldName) {
          await apiCall('updateUser', { userId: user.id, updates: { department: newName } });
        }
      }

      const requestsResult = await apiCall<{ data: any[] }>('getRequests');
      for (const req of requestsResult.data) {
        const updates: Record<string, string> = {};
        if (req.department === oldName) updates.department = newName;
        if (req.targetDepartment === oldName) updates.targetDepartment = newName;
        if (req.ccDepartment === oldName) updates.ccDepartment = newName;
        if (Object.keys(updates).length > 0) {
          // 직접 시트 업데이트가 필요하므로 개별 request 업데이트
          // Apps Script에 updateRequestFields 액션을 추가하거나, 기존 updateRequestStatus를 활용
          // 여기서는 단순화를 위해 로그만 남김
          console.log(`Request ${req.id} 부서 업데이트 필요:`, updates);
        }
      }
    } catch (e) {
      console.error('부서 참조 업데이트 실패:', e);
    }
  };

  if (!loaded) return null;

  return (
    <SettingsContext.Provider value={{
      systemSettings,
      departments,
      updateSystemSettings,
      addDepartment,
      deleteDepartment,
      editDepartment,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}
