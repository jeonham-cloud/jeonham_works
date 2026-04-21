import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRequest } from '../contexts/RequestContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  UserPlus, Users, Search, Edit2, Trash2, 
  ShieldCheck, Clock, AlertCircle, Building2, 
  Plus, X, Check, Power, User as UserIcon,
  Mail, Pencil
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TEXTS } from '../constants/texts';
import { User } from '../types';
import { Navigate } from 'react-router-dom';

export default function Admin() {
  const { 
    currentUser,
    users, 
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  } = useAuth();
  
  const { requests } = useRequest();
  
  const {
    departments,
    addDepartment, 
    deleteDepartment,
    editDepartment,
  } = useSettings();
  
  // Auth check
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [editingDeptName, setEditingDeptName] = useState<string | null>(null);
  const [editingDeptValue, setEditingDeptValue] = useState('');

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // User Form State
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    department: '',
    role: 'user' as User['role'],
    active: true
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = filterRole === 'all' || u.role === filterRole;
      const matchesDept = filterDept === 'all' || u.department === filterDept;
      
      return matchesSearch && matchesRole && matchesDept;
    });
  }, [users, searchTerm, filterRole, filterDept]);

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      email: '',
      department: departments[0] || '',
      role: 'user',
      active: true
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      active: user.active
    });
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userForm.email)) {
      alert('올바른 이메일 주소를 입력하세요.');
      return;
    }

    if (editingUser) {
      await updateUser(editingUser.id, {
        name: userForm.name,
        email: userForm.email,
        department: userForm.department,
        role: userForm.role,
        active: userForm.active
      });
    } else {
      await createUser({
        name: userForm.name,
        email: userForm.email,
        department: userForm.department,
        role: userForm.role,
        active: userForm.active
      });
    }
    setIsUserModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setIsDeleteConfirmOpen(false);
      setUserToDelete(null);
    }
  };

  const handleAddDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDeptName.trim()) {
      addDepartment(newDeptName.trim());
      setNewDeptName('');
    }
  };

  const handleEditDept = async (oldName: string) => {
    if (editingDeptValue.trim() && editingDeptValue.trim() !== oldName) {
      await editDepartment(oldName, editingDeptValue.trim());
    }
    setEditingDeptName(null);
    setEditingDeptValue('');
  };

  return (
    <div className="p-8 lg:p-12 max-w-7xl mx-auto w-full space-y-12">
      {/* User Create/Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant/20">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary font-headline">
                {editingUser ? '사용자 정보 수정' : '신규 사용자 등록'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUserSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">이름</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input 
                    type="text" 
                    required
                    value={userForm.name}
                    onChange={e => setUserForm({...userForm, name: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">이메일 (Google 계정)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
                  <input 
                    type="email" 
                    required
                    value={userForm.email}
                    onChange={e => setUserForm({...userForm, email: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    placeholder="google@example.com"
                  />
                </div>
              </div>
              {!editingUser && (
                <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    * 사용자는 등록된 Google 이메일로 로그인할 수 있습니다. 별도 비밀번호 설정이 필요하지 않습니다.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">소속 부서</label>
                  <select 
                    value={userForm.department}
                    onChange={e => setUserForm({...userForm, department: e.target.value})}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="">부서 선택</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">권한</label>
                  <select 
                    value={userForm.role}
                    onChange={e => setUserForm({...userForm, role: e.target.value as User['role']})}
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none appearance-none"
                  >
                    <option value="user">업무담당자</option>
                    <option value="manager">부서담당자</option>
                    <option value="admin">관리자</option>
                    <option value="finance">재정담당</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserForm({...userForm, active: !userForm.active})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    userForm.active ? "bg-primary" : "bg-outline-variant"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                    userForm.active ? "left-7" : "left-1"
                  )} />
                </button>
                <span className="text-sm font-medium text-on-surface">계정 활성화 상태</span>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="flex-1 py-3 bg-white text-on-surface-variant font-bold rounded-xl border border-outline-variant/20 hover:bg-slate-50 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-container transition-all"
                >
                  {editingUser ? '수정 완료' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dept Modal */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant/20">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary font-headline">부서 관리</h3>
              <button onClick={() => setIsDeptModalOpen(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Add Dept Form */}
              <form onSubmit={handleAddDept} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">신규 부서 추가</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      required
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      className="flex-1 bg-surface-container-low border border-outline-variant/20 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="부서 이름을 입력하세요"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary-container transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>추가</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Dept List */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-on-surface-variant uppercase">현재 부서 목록</label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {departments.map(dept => (
                    <div key={dept} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 group">
                      {editingDeptName === dept ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            type="text"
                            autoFocus
                            value={editingDeptValue}
                            onChange={e => setEditingDeptValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); handleEditDept(dept); }
                              if (e.key === 'Escape') { setEditingDeptName(null); setEditingDeptValue(''); }
                            }}
                            className="flex-1 text-sm px-2 py-1 border border-primary/30 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                          />
                          <button onClick={() => handleEditDept(dept)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Check className="w-4 h-4" /></button>
                          <button onClick={() => { setEditingDeptName(null); setEditingDeptValue(''); }} className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-on-surface">{dept}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => { setEditingDeptName(dept); setEditingDeptValue(dept); }}
                              className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="부서명 수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteDepartment(dept)}
                              className="p-1.5 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all"
                              title="부서 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant italic">* 부서 삭제 시 해당 부서의 사용자 및 요청 데이터는 유지됩니다.</p>
              </div>
            </div>
            <div className="p-6 bg-surface-container-low/50 border-t border-outline-variant/10">
              <button 
                onClick={() => setIsDeptModalOpen(false)}
                className="w-full py-3 bg-white text-on-surface-variant font-bold rounded-xl border border-outline-variant/20 hover:bg-slate-50 transition-all"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {isDeleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-outline-variant/20">
            <div className="flex items-center gap-4 text-error mb-4">
              <div className="w-12 h-12 bg-error/10 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-headline">계정 삭제 확인</h3>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              <span className="font-bold text-on-surface">{userToDelete.name}</span> ({userToDelete.email}) 계정을 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-3 bg-surface-container-low text-on-surface-variant font-bold rounded-xl border border-outline-variant/10 hover:bg-surface-container-high transition-all"
              >
                취소
              </button>
              <button 
                onClick={handleDeleteUser}
                className="flex-1 py-3 bg-error text-white font-bold rounded-xl shadow-lg hover:bg-error/90 transition-all"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface font-headline">{TEXTS.ADMIN.TITLE}</h2>
          <p className="text-on-surface-variant font-medium">{TEXTS.ADMIN.SUBTITLE}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsDeptModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest text-primary rounded-xl font-bold text-sm border border-primary/10 hover:bg-primary/5 transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span>부서 관리</span>
          </button>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-container transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>{TEXTS.ADMIN.ADD_USER}</span>
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.STATS_TOTAL_USERS}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">{users.length}</div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-secondary-fixed rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.STATS_ADMINS}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-tertiary" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.STATS_PENDING}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">
            {requests.filter(r => r.status === 'submitted' || r.status === 'reviewing').length}
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-error-container rounded-xl flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-error" />
            </div>
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.STATS_REJECTED}</span>
          </div>
          <div className="text-3xl font-black text-on-surface">
            {requests.filter(r => r.status === 'rejected').length}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-on-surface font-headline">{TEXTS.ADMIN.USER_MANAGEMENT}</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
              <input 
                type="text"
                placeholder="이름 또는 이메일로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full md:w-64"
              />
            </div>
            <select 
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="bg-surface-container-low border-none rounded-xl text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">모든 부서</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select 
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="bg-surface-container-low border-none rounded-xl text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">모든 권한</option>
              <option value="user">업무담당자</option>
              <option value="manager">부서담당자</option>
              <option value="admin">관리자</option>
              <option value="finance">재정담당</option>
            </select>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">이름 / 이메일</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.TABLE_ROLE}</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.TABLE_DEPT}</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.ADMIN.TABLE_STATUS}</th>
                  <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">{TEXTS.ADMIN.TABLE_ACTIONS}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            user.name[0]
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-on-surface">{user.name}</div>
                          <div className="text-xs text-on-surface-variant">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-bold uppercase tracking-wider",
                        user.role === 'admin' ? "bg-primary/10 text-primary" :
                        user.role === 'manager' ? "bg-secondary/10 text-secondary" :
                        user.role === 'finance' ? "bg-tertiary/10 text-tertiary" :
                        "bg-surface-variant text-on-surface-variant"
                      )}>
                        {user.role === 'admin' ? '관리자' :
                         user.role === 'manager' ? '부서담당자' :
                         user.role === 'finance' ? '재정담당' : '업무담당자'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-xs font-medium text-on-surface-variant">{user.department || '미지정'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <button 
                        onClick={() => toggleUserStatus(user.id)}
                        disabled={user.id === currentUser.id}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight border transition-all",
                          user.active 
                            ? 'bg-secondary-container text-on-secondary-container border-secondary/20' 
                            : 'bg-surface-variant text-on-surface-variant border-outline-variant/30 opacity-50',
                          user.id === currentUser.id && "cursor-not-allowed"
                        )}
                      >
                        <Power className="w-3 h-3" />
                        {user.active ? TEXTS.ADMIN.STATUS_ACTIVE : '비활성'}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleOpenEditModal(user)}
                          className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                          title="정보 수정"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setUserToDelete(user);
                            setIsDeleteConfirmOpen(true);
                          }}
                          disabled={user.id === currentUser.id}
                          className={cn(
                            "p-2 text-on-surface-variant hover:text-error hover:bg-error/5 rounded-lg transition-all",
                            user.id === currentUser.id && "opacity-20 cursor-not-allowed"
                          )}
                          title="계정 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
