import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Check, User as UserIcon, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function TopBar() {
  const { currentUser, logout } = useAuth();
  const { notifications, markNotificationAsRead, markAllAsRead } = useNotification();
  const { systemSettings } = useSettings();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/requests?search=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };

  if (!currentUser) return null;

  const userNotifications = notifications.filter(n => n.userId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;
  const recentNotifications = userNotifications.slice(0, 10);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    setShowNotifications(false);
    navigate(`/requests/${notif.requestId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 w-full glass-effect shadow-sm shadow-primary/5">
      <div className="flex items-center gap-8">
        <form onSubmit={handleSearchSubmit} className="relative group hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input 
            type="text" 
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="요청 검색..." 
            className="pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-primary-container transition-all"
          />
        </form>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 border-l border-outline-variant/30 pl-6">
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-on-surface-variant hover:text-primary transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error text-xs text-white flex items-center justify-center rounded-full ring-2 ring-white font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50">
                <div className="p-4 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
                  <h3 className="text-sm font-bold text-on-surface">알림</h3>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{unreadCount}개 미확인</span>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {recentNotifications.length > 0 ? (
                    recentNotifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={cn(
                          "w-full text-left p-4 hover:bg-surface-container-low transition-colors border-b border-outline-variant/5 flex gap-3",
                          !notif.read && "bg-primary/5"
                        )}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 shrink-0",
                          notif.read ? "bg-outline-variant" : "bg-primary"
                        )} />
                        <div className="space-y-1">
                          <p className={cn("text-xs leading-relaxed", notif.read ? "text-on-surface-variant" : "text-on-surface font-medium")}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-outline">
                            {new Date(notif.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-on-surface-variant">새로운 알림이 없습니다.</p>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-surface-container-low flex items-center justify-between border-t border-outline-variant/10">
                  <button className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">모든 알림 보기</button>
                  {unreadCount > 0 && (
                    <button 
                      onClick={() => markAllAsRead()}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      모두 읽음
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-primary leading-tight">{currentUser.name}</p>
                <p className="text-xs text-on-surface-variant font-medium">{currentUser.department}</p>
              </div>
              <div className="relative">
                <img 
                  src={currentUser.avatar} 
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-outline-variant/10">
                  <ChevronDown className="w-3 h-3 text-on-surface-variant" />
                </div>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50">
                <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low">
                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{currentUser.role}</p>
                  <p className="text-sm font-bold text-on-surface">{currentUser.name}</p>
                  <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
                </div>
                <div className="p-2">
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-lg transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    내 정보
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low hover:text-primary rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    설정
                  </Link>
                  <div className="h-px bg-outline-variant/10 my-2" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/5 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
