import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ListTodo, PlusCircle, ShieldCheck, Settings, LogOut, CheckSquare, CalendarDays, Utensils, ScrollText } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { TEXTS } from '../constants/texts';

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: TEXTS.SIDEBAR.DASHBOARD },
    { to: '/requests', icon: ListTodo, label: TEXTS.SIDEBAR.MY_REQUESTS },
    { to: '/schedules', icon: CalendarDays, label: '부서별 일정' },
    { to: '/create', icon: PlusCircle, label: TEXTS.SIDEBAR.CREATE_REQUEST },
    { to: '/admin', icon: ShieldCheck, label: TEXTS.SIDEBAR.ADMIN, roles: ['admin'] },
    { to: '/lunch', icon: Utensils, label: '먹어볼까?' },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(currentUser.role)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 bg-surface-container-low fixed left-0 top-0 z-40 p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-white shadow-lg">
          <CheckSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-primary leading-tight font-headline">{TEXTS.COMMON.APP_NAME}</h2>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">{TEXTS.COMMON.APP_SUBTITLE}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-semibold text-sm",
                isActive 
                  ? "bg-surface-container-lowest text-primary shadow-sm" 
                  : "text-on-surface-variant hover:bg-surface-container-high hover:translate-x-1"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-outline-variant/30 space-y-2">
        <button 
          onClick={() => navigate('/create')}
          className="w-full flex items-center justify-center gap-2 py-3 signature-gradient text-white rounded-lg shadow-lg font-bold hover:opacity-90 active:scale-95 transition-all mb-4"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{TEXTS.SIDEBAR.NEW_REQUEST_BTN}</span>
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-all text-sm rounded-lg"
        >
          <Settings className="w-4 h-4" />
          <span>{TEXTS.SIDEBAR.SETTINGS}</span>
        </button>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error-container/20 transition-all text-sm rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>{TEXTS.SIDEBAR.LOGOUT}</span>
        </button>
      </div>
    </aside>
  );
}
