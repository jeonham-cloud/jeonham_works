import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types';
import { apiCall, googleLogout, GoogleUserProfile } from '../lib/googleApi';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  login: (profile: GoogleUserProfile) => Promise<User>;
  logout: () => void;
  createUser: (payload: { email: string; name: string; role: User['role']; department: string; active: boolean }) => Promise<void>;
  updateUser: (userId: string, payload: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<User[]>([]);

  // 사용자 목록 가져오기
  const refreshUsers = useCallback(async () => {
    try {
      const result = await apiCall<{ data: User[] }>('getUsers');
      setUsers(result.data);

      // 현재 사용자 상태도 동기화
      if (currentUser) {
        const updatedCurrent = result.data.find(u => u.id === currentUser.id);
        if (updatedCurrent) {
          setCurrentUser(updatedCurrent);
        }
      }
    } catch (e) {
      console.error('사용자 목록 로드 실패:', e);
    }
  }, [currentUser?.id]);

  // 초기 로드 + 주기적 폴링
  useEffect(() => {
    refreshUsers();
    const interval = setInterval(refreshUsers, 60000); // 60초 간격 폴링
    return () => clearInterval(interval);
  }, []);



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
      // Apps Script에 upsert 요청 (없으면 생성, 있으면 조회)
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
      await refreshUsers();
      return user;
    } catch (e: any) {
      // API 실패 시 Google 프로필로 임시 사용자 생성 (로컬 전용)
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
  };

  const createUser = async (payload: { email: string; name: string; role: User['role']; department: string; active: boolean }) => {
    if (users.some(u => u.email === payload.email)) {
      alert('이미 등록된 이메일입니다.');
      return;
    }

    try {
      await apiCall('upsertUser', {
        email: payload.email,
        name: payload.name,
        avatar: '',
      });

      // 역할과 부서를 추가로 설정
      const updatedUsers = await apiCall<{ data: User[] }>('getUsers');
      const newUser = updatedUsers.data.find(u => u.email === payload.email);
      if (newUser) {
        await apiCall('updateUser', {
          userId: newUser.id,
          updates: {
            role: payload.role,
            department: payload.department,
            active: String(payload.active),
          }
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
    if (updates.active !== undefined) {
      updates.active = String(updates.active);
    }

    await apiCall('updateUser', { userId, updates });

    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...payload } : null);
    }
    await refreshUsers();
  };

  const deleteUser = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert('본인 계정은 삭제할 수 없습니다.');
      return;
    }
    await apiCall('deleteUser', { userId });
    await refreshUsers();
  };

  const toggleUserStatus = async (userId: string) => {
    if (currentUser?.id === userId) {
      alert('본인 계정은 비활성화할 수 없습니다.');
      return;
    }
    await apiCall('toggleUserStatus', { userId });
    await refreshUsers();
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      users,
      login,
      logout,
      createUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      refreshUsers,
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
