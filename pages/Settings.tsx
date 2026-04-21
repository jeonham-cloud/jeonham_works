import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Settings as SettingsIcon, 
  Building2, 
  ShieldCheck, 
  Monitor, 
  User as UserIcon,
  CheckCircle2,
  Bell,
  LogOut,
  Calendar,
  ScrollText,
  Mail
} from 'lucide-react';
import { RolePermissionSummary } from '../types';
import { useNavigate } from 'react-router-dom';

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const { departments, systemSettings, updateSystemSettings } = useSettings();
  const isAdmin = currentUser?.role === 'admin';
  const navigate = useNavigate();

  const rolePermissions: RolePermissionSummary[] = [
    {
      role: 'admin',
      description: '시스템 전체 관리자',
      permissions: ['모든 업무 요청 관리', '직원 계정 생성/수정/삭제', '시스템 설정 변경', '부서 정보 관리']
    },
    {
      role: 'manager',
      description: '부서별 업무 담당자',
      permissions: ['부서 업무 요청 승인/반려', '업무 담당자 지정', '상태 변경 이력 관리']
    },
    {
      role: 'finance',
      description: '재정/구매 담당자',
      permissions: ['재정 관련 업무 요청 검토', '구매 및 지출 결의 확인']
    },
    {
      role: 'user',
      description: '일반 직원',
      permissions: ['업무 요청 생성', '본인 요청 상태 확인', '댓글 및 피드백 작성']
    }
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-blue-100 p-2 rounded-lg">
          <SettingsIcon className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">설정</h1>
          <p className="text-slate-500 text-sm">시스템 운영 및 개인 계정 설정을 관리합니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. 조직 설정 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-800">조직 설정</h2>
            </div>
            {isAdmin && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">관리자 전용</span>
            )}
          </div>
          <div className="p-5 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">등록된 부서 목록</label>
              <div className="grid grid-cols-2 gap-2">
                {departments.map((dept) => (
                  <div key={dept} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-sm text-slate-700">{dept}</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="w-full py-2 px-4 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Building2 className="h-4 w-4" />
                부서 관리 바로가기
              </button>
            )}
          </div>
        </section>

        {/* 2. 권한/역할 안내 */}
        {isAdmin && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
              <ShieldCheck className="h-5 w-5 text-slate-500 mr-2" />
              <h2 className="font-semibold text-slate-800">권한 및 역할 정책</h2>
            </div>
            <div className="p-5 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
              {rolePermissions.map((rp) => (
                <div key={rp.role} className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-slate-900 uppercase">{rp.role}</span>
                    <span className="text-xs text-slate-500">{rp.description}</span>
                  </div>
                  <ul className="space-y-1">
                    {rp.permissions.map((p, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-center">
                        <div className="w-1 h-1 bg-slate-400 rounded-full mr-2" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. 시스템 설정 */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
            <Monitor className="h-5 w-5 text-slate-500 mr-2" />
            <h2 className="font-semibold text-slate-800">시스템 설정</h2>
          </div>
          <div className="p-5 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Bell className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">알림 표시</p>
                  <p className="text-xs text-slate-500">새로운 요청이나 상태 변경 시 알림을 받습니다.</p>
                </div>
              </div>
              <button 
                onClick={() => updateSystemSettings({ showNotifications: !systemSettings.showNotifications })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${systemSettings.showNotifications ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.showNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <LogOut className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">로그아웃 확인</p>
                  <p className="text-xs text-slate-500">로그아웃 시 확인 모달을 표시합니다.</p>
                </div>
              </div>
              <button 
                onClick={() => updateSystemSettings({ useLogoutConfirm: !systemSettings.useLogoutConfirm })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${systemSettings.useLogoutConfirm ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.useLogoutConfirm ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 p-2 rounded-lg">
                  <Calendar className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">날짜 표시 형식</p>
                  <p className="text-xs text-slate-500">시스템 전반의 날짜 형식을 설정합니다.</p>
                </div>
              </div>
              <select 
                value={systemSettings.dateFormat}
                onChange={(e) => updateSystemSettings({ dateFormat: e.target.value as any })}
                className="text-sm border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              </select>
            </div>
          </div>
        </section>

        {/* 4. 계정 설정 (Google 계정 정보 표시) */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center">
            <UserIcon className="h-5 w-5 text-slate-500 mr-2" />
            <h2 className="font-semibold text-slate-800">내 계정 정보</h2>
          </div>
          <div className="p-5">
            <div className="flex items-center space-x-4 mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
              <img 
                src={currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'} 
                alt="Avatar" 
                className="h-16 w-16 rounded-full border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-900">{currentUser?.name}</h3>
                <p className="text-sm text-blue-600 font-medium">{currentUser?.role?.toUpperCase()} • {currentUser?.department || '부서 미지정'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  이메일
                </span>
                <span className="text-sm font-medium text-slate-800">{currentUser?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-sm text-slate-500">가입일</span>
                <span className="text-sm font-medium text-slate-800">{currentUser?.createdAt}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
              <p className="text-xs text-green-700 leading-relaxed">
                ✅ Google 계정으로 인증되었습니다. 비밀번호는 Google 계정에서 관리됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 5. 시스템 로그 (Admin Only) */}
        {isAdmin && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center">
                <ScrollText className="h-5 w-5 text-slate-500 mr-2" />
                <h2 className="font-semibold text-slate-800">시스템 감사 로그</h2>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                시스템 내에서 발생한 주요 활동(생성/삭제) 이력을 확인하고 텍스트 파일로 추출할 수 있습니다. 
                이 기능은 관리자(Admin)에게만 제공됩니다.
              </p>
              <button 
                onClick={() => navigate('/logs')}
                className="flex items-center justify-center w-full px-4 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm hover:bg-slate-900 transition-colors shadow-md"
              >
                시스템 로그 열람하기
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Settings;
