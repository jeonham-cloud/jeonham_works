import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { TaskRequest } from '../types';
import { TEXTS } from '../constants/texts';
import { apiCall } from '../lib/googleApi';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

interface RequestContextType {
  requests: TaskRequest[];
  categories: string[];
  addRequest: (request: Omit<TaskRequest, 'id' | 'createdAt' | 'comments' | 'history' | 'assignee'>) => void;
  updateRequestStatus: (id: string, status: TaskRequest['status'], comment?: string) => Promise<void>;
  addComment: (requestId: string, content: string) => Promise<void>;
  editComment: (requestId: string, commentId: string, newContent: string) => Promise<void>;
  deleteComment: (requestId: string, commentId: string) => Promise<void>;
  assignTask: (requestId: string, userId: string | null) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  addCategory: (name: string) => void;
  deleteCategory: (name: string) => void;
  editCategory: (oldName: string, newName: string) => Promise<void>;
  refreshRequests: () => Promise<void>;
}

const RequestContext = createContext<RequestContextType | undefined>(undefined);

const DEFAULT_CATEGORIES = ['일반', '디자인', '영상/미디어', '웹/IT', '마케팅/광고'];

export function RequestProvider({ children, onRequestsChange }: { children: ReactNode; onRequestsChange: (requests: TaskRequest[]) => void }) {
  const { currentUser, users } = useAuth();
  const { addNotification, refreshNotifications } = useNotification();
  const [requests, setRequests] = useState<TaskRequest[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // 요청 목록 가져오기
  const refreshRequests = useCallback(async () => {
    try {
      const result = await apiCall<{ data: TaskRequest[] }>('getRequests');
      setRequests(result.data);
      onRequestsChange(result.data);
    } catch (e) {
      console.error('요청 로드 실패:', e);
    }
  }, [onRequestsChange]);

  // 카테고리 로드
  const loadCategories = useCallback(async () => {
    try {
      const result = await apiCall<{ data: Record<string, any> }>('getSettings');
      if (result.data.categories && Array.isArray(result.data.categories)) {
        setCategories(result.data.categories);
      }
    } catch (e) {
      console.error('카테고리 로드 실패:', e);
    }
  }, []);

  // 초기 로드 + 폴링
  useEffect(() => {
    refreshRequests();
    loadCategories();
    const interval = setInterval(refreshRequests, 30000); // 30초
    return () => clearInterval(interval);
  }, [refreshRequests, loadCategories]);

  const addCategory = async (name: string) => {
    if (!categories.includes(name)) {
      const newList = [...categories, name];
      setCategories(newList);
      await apiCall('updateSetting', { key: 'categories', value: newList });
    }
  };

  const deleteCategory = async (name: string) => {
    const newList = categories.filter(c => c !== name);
    setCategories(newList);
    await apiCall('updateSetting', { key: 'categories', value: newList });
  };

  const editCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const newList = categories.map(c => c === oldName ? newName : c);
    setCategories(newList);
    await apiCall('updateSetting', { key: 'categories', value: newList });
  };

  const addRequest = async (newReq: Omit<TaskRequest, 'id' | 'createdAt' | 'comments' | 'history' | 'assignee'>) => {
    if (!currentUser) return;

    const request = {
      ...newReq,
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      await apiCall('addRequest', {
        request,
        actorId: currentUser.id,
        actorName: currentUser.name,
        actorRole: currentUser.role,
      });

      await refreshRequests();
      await refreshNotifications();
    } catch (e: any) {
      alert('데이터 연결 오류: ' + e.message);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!currentUser) return;

    const req = requests.find(r => r.id === id);
    if (!req) return;

    const isOwner = req.requesterId === currentUser.id;
    const isAdmin = currentUser.role === 'admin';

    if (!isOwner && !isAdmin) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    try {
      await apiCall('deleteRequest', {
        requestId: id,
        actorId: currentUser.id,
        actorName: currentUser.name,
      });

      if (isAdmin && !isOwner) {
        await addNotification(req.requesterId, `관리자에 의해 요청 [${req.title}] 데이터가 삭제되었습니다.`);
      }

      await refreshRequests();
    } catch (e: any) {
      alert('데이터 삭제 오류: ' + e.message);
    }
  };

  const updateRequestStatus = async (id: string, toStatus: TaskRequest['status'], comment?: string) => {
    if (!currentUser) return;
    const request = requests.find(r => r.id === id);
    if (!request) return;

    const fromStatus = request.status;
    const role = currentUser.role;

    // 권한 검증 (프론트에서도 이중 체크)
    let isValid = false;
    let errorMsg = '';

    if (role === 'admin') {
      isValid = true;
    } else if (role === 'manager' || role === 'finance') {
      if (fromStatus === 'submitted' && (toStatus === 'reviewing' || toStatus === 'approved' || toStatus === 'rejected')) isValid = true;
      else if (fromStatus === 'reviewing' && (toStatus === 'approved' || toStatus === 'rejected')) isValid = true;
      else if (fromStatus === 'approved' && toStatus === 'in-progress') isValid = true;
      else if (fromStatus === 'in-progress' && toStatus === 'completed') isValid = true;
      else {
        errorMsg = role === 'finance'
          ? '재정담당자는 요청의 검토, 승인, 반려 및 진행 상태 변경만 가능합니다.'
          : '부서담당자는 제출된 요청의 검토, 승인, 반려 및 진행 상태 변경만 가능합니다.';
      }
    } else if (role === 'user') {
      if (fromStatus === 'draft' && toStatus === 'submitted') isValid = true;
      else if (fromStatus === 'rejected' && toStatus === 'submitted') {
        if (request.requesterId === currentUser.id) isValid = true;
        else errorMsg = '본인이 작성한 반려된 요청만 재제출할 수 있습니다.';
      } else {
        errorMsg = '일반 사용자는 요청 제출만 가능합니다.';
      }
    }

    if (!isValid) {
      alert(errorMsg || '권한이 없거나 잘못된 상태 변경입니다.');
      return;
    }

    try {
      await apiCall('updateRequestStatus', {
        requestId: id,
        toStatus,
        comment,
        actorName: currentUser.name,
        actorRole: currentUser.role,
        actorId: currentUser.id,
      });

      await refreshRequests();
      await refreshNotifications();
    } catch (e: any) {
      alert('상태 변경 오류: ' + e.message);
    }
  };

  const assignTask = async (requestId: string, userId: string | null) => {
    if (!currentUser) return;
    const role = currentUser.role;
    if (role !== 'admin' && role !== 'manager') {
      alert('담당자 지정 권한이 없습니다.');
      return;
    }

    try {
      await apiCall('assignTask', {
        requestId,
        userId,
        actorId: currentUser.id,
        actorName: currentUser.name,
      });

      await refreshRequests();
      await refreshNotifications();
    } catch (e: any) {
      alert('담당자 지정 오류: ' + e.message);
    }
  };

  const addComment = async (requestId: string, content: string) => {
    if (!currentUser) return;

    const comment = {
      id: `com-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar || '',
      content,
      createdAt: new Date().toISOString(),
    };

    try {
      await apiCall('addComment', {
        requestId,
        comment,
        actorId: currentUser.id,
        actorName: currentUser.name,
      });

      await refreshRequests();
      await refreshNotifications();
    } catch (e: any) {
      alert('댓글 작성 오류: ' + e.message);
    }
  };

  const editComment = async (requestId: string, commentId: string, newContent: string) => {
    if (!currentUser) return;
    try {
      await apiCall('editComment', { commentId, newContent });
      await refreshRequests();
    } catch (e: any) {
      alert('댓글 수정 오류: ' + e.message);
    }
  };

  const deleteComment = async (requestId: string, commentId: string) => {
    if (!currentUser) return;
    try {
      await apiCall('deleteComment', { commentId });
      await refreshRequests();
    } catch (e: any) {
      alert('댓글 삭제 오류: ' + e.message);
    }
  };

  return (
    <RequestContext.Provider value={{
      requests,
      categories,
      addRequest,
      updateRequestStatus,
      addComment,
      editComment,
      deleteComment,
      assignTask,
      deleteRequest,
      addCategory,
      deleteCategory,
      editCategory,
      refreshRequests,
    }}>
      {children}
    </RequestContext.Provider>
  );
}

export function useRequest() {
  const context = useContext(RequestContext);
  if (!context) throw new Error('useRequest must be used within RequestProvider');
  return context;
}
