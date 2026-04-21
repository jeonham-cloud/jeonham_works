import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRequest } from '../contexts/RequestContext';
import { useSettings } from '../contexts/SettingsContext';
import { Inbox, Clock, CheckCircle2, Activity, Users, Building2, ArrowUpRight, BarChart2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { TEXTS } from '../constants/texts';

export default function Dashboard() {
  const { users } = useAuth();
  const { requests } = useRequest();
  const { departments } = useSettings();
  const navigate = useNavigate();

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const kpis = [
    { label: "전체 요청 수", value: requests.length, icon: Inbox, color: 'bg-primary/10 text-primary' },
    { label: "이번 달 접수", value: requests.filter(r => r.createdAt.startsWith(currentMonth)).length, icon: Activity, color: 'bg-secondary/10 text-secondary' },
    { label: "진행중 요청", value: requests.filter(r => r.status === 'in-progress').length, icon: Clock, color: 'bg-tertiary/10 text-tertiary' },
    { label: "완료율", value: `${Math.round((requests.filter(r => r.status === 'completed').length / (requests.length || 1)) * 100)}%`, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
  ];

  const deptStats = departments.map(dept => {
    const deptRequests = requests.filter(r => r.targetDepartment === dept);
    const deptUsers = users.filter(u => u.department === dept);
    const completedCount = deptRequests.filter(r => r.status === 'completed').length;
    const totalCount = deptRequests.length;
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      name: dept,
      total: totalCount,
      inProgress: deptRequests.filter(r => r.status === 'in-progress').length,
      completed: completedCount,
      userCount: deptUsers.length,
      completionRate
    };
  });

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1 font-headline">{TEXTS.DASHBOARD.TITLE}</h1>
          <p className="text-on-surface-variant font-medium">{TEXTS.DASHBOARD.SUBTITLE}</p>
        </div>
        <div className="px-4 py-2 bg-white rounded-xl flex items-center gap-2 shadow-sm border border-outline-variant/10">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-on-surface uppercase tracking-wider">시스템 정상 운영 중</span>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/5 flex flex-col gap-4 group hover:shadow-md transition-all">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.color)}>
              <kpi.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{kpi.label}</p>
              <p className="text-3xl font-black text-on-surface mt-1 font-headline">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Department Status Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface tracking-tight font-headline">부서별 업무 현황</h2>
          <Link to="/requests" className="text-sm font-bold text-primary flex items-center gap-1 hover:underline">
            전체 업무 보기 <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deptStats.map((dept) => (
            <div 
              key={dept.name}
              onClick={() => navigate(`/requests?department=${dept.name}`)}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">업무 진행률</div>
                  <div className="text-xl font-black text-primary font-headline">{dept.completionRate}%</div>
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <h3 className="text-lg font-bold text-on-surface group-hover:text-primary transition-colors">{dept.name}</h3>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-container-low p-2 rounded-lg text-center">
                    <div className="text-xs font-bold text-on-surface-variant uppercase">요청</div>
                    <div className="text-sm font-black text-on-surface">{dept.total}</div>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-lg text-center">
                    <div className="text-xs font-bold text-on-surface-variant uppercase">진행</div>
                    <div className="text-sm font-black text-secondary">{dept.inProgress}</div>
                  </div>
                  <div className="bg-surface-container-low p-2 rounded-lg text-center">
                    <div className="text-xs font-bold text-on-surface-variant uppercase">완료</div>
                    <div className="text-sm font-black text-emerald-600">{dept.completed}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-bold">
                    <Users className="w-3.5 h-3.5" />
                    <span>업무담당자 {dept.userCount}명</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    상세보기 <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Progress Bar Background */}
              <div className="absolute bottom-0 left-0 h-1 bg-primary/20 transition-all duration-500" style={{ width: `${dept.completionRate}%` }}></div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Insights */}
      <div className="grid grid-cols-1 gap-8">
        <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-on-surface font-headline">부서별 요청 비중</h2>
            <BarChart2 className="w-5 h-5 text-on-surface-variant" />
          </div>
          
          <div className="space-y-5">
            {deptStats.sort((a, b) => b.total - a.total).map((dept) => {
              const ratio = Math.round((dept.total / (requests.length || 1)) * 100);
              return (
                <div key={dept.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                    <span>{dept.name}</span>
                    <span>{ratio}% ({dept.total}건)</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out" 
                      style={{ width: `${ratio}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
