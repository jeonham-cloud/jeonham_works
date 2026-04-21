import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, TaskRequest } from '../types';
import { apiCall, googleLogout, GoogleUserProfile } from '../lib/googleApi';

// ============================================================
// Bootstrap 캐시 유틸리티
// ============================================================
const CACHE_KEY = 'gc_bootstrap';
const CACHE_TTL = 5 * 60 * 1000; // 5분

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function setCache(data: any) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {}
}

// ============================================================
// Types
// ============================================================
export interface BootstrapData {
  users: User[];
  requests: TaskRequest[];
  settings: Record<string, any>;
  notifications: any[];
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  bootstrapData: BootstrapData | null;
  bootstrapLoading: boolean;
  login: (profile: GoogleUserProfile) => Promise<User>;
  logout: () => void;
  createUser: (payload: { email: string; name: string; role: User['role']; department: string; active: boolean }) => Promise<void>;
  updateUser: (userId: string, payload: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
  refreshBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [bootstrapData, setBootstrapData] = useState<BootstrapData | null>(() => getCache());
  const [bootstrapLoading, setBootstrapLoading] = useState(true);

  // Bootstrap: 모든 초기 데이터를 한 번에 가져오기
  const refreshBootstrap = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.id;
    try {
      const result = await apiCall<{ data: BootstrapData }>('bootstrap', { userId: uid || '' });
      setBootstrapData(result.data);
      setUsers(result.data.users);
      setCache(result.data);

      // 현재 사용자 상태 동기화
      if (uid) {
        const updatedCurrent = result.data.users.find(u => u.id === uid);
        if (updatedCurrent) setCurrentUser(updatedCurrent);
      }
    } catch (e) {
      console.error('Bootstrap 실패:', e);
    } finally {
      setBootstrapLoading(false);
    }
  }, [currentUser?.id]);

  // 사용자 목록만 가져오기 (경량)
  const refreshUsers = useCallback(async () => {
    try {
      const result = await apiCall<{ data: User[] }>('getUsers');
      setUsers(result.data);
      if (currentUser) {
        const updatedCurrent = result.data.find(u => u.id === currentUser.id);
        if (updatedCurrent) setCurrentUser(updatedCurrent);
      }
    } catch (e) {
      console.error('사용자 목록 로드 실패:', e);
    }
  }, [currentUser?.id]);

  // 앱 시작 시 bootstrap (캐시 있으면 즉시 표시 후 백그라운드 갱신)
  useEffect(() => {
    if (bootstrapData) {
      // 캐시 데이터를 즉시 사용
      setUsers(bootstrapData.users);
      if (currentUser) {
        const updatedCurrent = bootstrapData.users.find(u => u.id === currentUser.id);
        if (updatedCurrent) setCurrentUser(updatedCurrent);
      }
      setBootstrapLoading(false);
      // 백그라운드에서 최신 데이터 갱신
      refreshBootstrap();
    } else {
      refreshBootstrap();
    }
  }, []); // 최초 1회만

  // 주기적 폴링 (120초 - 이전 30초에서 늘림)
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(() => refreshBootstrap(), 120_000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // localStorage 동기화
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gc_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gc_user');
    }
  }, [currentUser]);

  const login = async (profile: GoogleUserProfile): Promise<User> => {
    try {
      const result = await apiCall<{ data: User; isNew?: boolean }>('upsertUser', {
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
      });

      const user = result.data;
      user.active = user.active === true || (user.active as any) === 'true';

      if (!user.active) {
        throw new Error('비활성화된 계정입니다. 관리자에게 문의하세요.');
      }

      setCurrentUser(user);
      // 로그인 후 bootstrap으로 전체 데이터 로드
      await refreshBootstrap(user.id);
      return user;
    } catch (e: any) {
      // API 실패 시 Google 프로필로 임시 사용자 생성
      console.warn('Apps Script API 실패, 임시 로그인 처리:', e.message);
      const tempUser: User = {
        id: `temp-${Date.now()}`,
        email: profile.email,
        name: profile.name,
        role: 'user',
        department: '',
        active: true,
        avatar: profile.picture,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(tempUser);
      return tempUser;
    }
  };

  const logout = () => {
    if (currentUser?.email) {
      googleLogout(currentUser.email);
    }
    setCurrentUser(null);
    localStorage.removeItem(CACHE_KEY);
    setBootstrapData(null);
  };

  const createUser = async (payload: { email: string; name: string; role: User['role']; department: string; active: boolean }) => {
    if (users.some(u => u.email === payload.email)) {
      alert('이미 등록된 이메일입니다.');
      return;
    }
    try {
      await apiCall('upsertUser', { email: payload.email, name: payload.name, avatar: '' });
      const updatedUsers = await apiCall<{ data: User[] }>('getUsers');
      const newUser = updatedUsers.data.find(u => u.email === payload.email);
      if (newUser) {
        await apiCall('updateUser', {
          userId: newUser.id,
          updates: { role: payload.role, department: payload.department, active: String(payload.active) }
        });
      }
      await refreshUsers();
    } catch (e: any) {
      alert('사용자 등록 오류: ' + e.message);
    }
  };

  const updateUser = async (userId: string, payload: Partial<User>) => {
    if (payload.email && users.some(u => u.email === payload.email && u.id !== userId)) {
      alert('이미 등록된 이메일입니다.');
      return;
    }
    const updates: Record<string, any> = { ...payload };
    if (updates.active !== undefined) updates.active = String(updates.active);
    await apiCall('updateUser', { userId, updates });
    if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, ...payload } : null);
    await refreshUsers();
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.id === userId) { alert('본인 계정은 삭제할 수 없습니다.'); return; }
    await apiCall('deleteUser', { userId });
    await refreshUsers();
  };

  const toggleUserStatus = async (userId: string) => {
    if (currentUser?.id === userId) { alert('본인 계정은 비활성화할 수 없습니다.'); return; }
    await apiCall('toggleUserStatus', { userId });
    await refreshUsers();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      users,
      bootstrapData,
      bootstrapLoading,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      refreshUsers,
      refreshBootstrap,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
