import React, { useState, useEffect } from 'react';
import { useRequest } from '../contexts/RequestContext';
import { useSettings } from '../contexts/SettingsContext';
import { FileDown, Plus, Search, ChevronLeft, ChevronRight, Calendar, Filter, Users, CheckCircle2, Clock, AlertCircle, Tag } from 'lucide-react';
import { cn, getDueDateStatus } from '../lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { TEXTS } from '../constants/texts';

export default function RequestList() {
  const { requests, categories } = useRequest();
  const { departments } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const initialDept = queryParams.get('department') || 'all';
  const initialSearch = queryParams.get('search') || '';
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDept, setFilterDept] = useState(initialDept);
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dept = params.get('department');
    if (dept) setFilterDept(dept);
    
    const searchParam = params.get('search');
    if (searchParam !== null) setSearchQuery(searchParam);
  }, [location.search]);

  const filteredRequests = requests.filter(r => {
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    const deptMatch = filterDept === 'all' || r.targetDepartment === filterDept || r.ccDepartment === filterDept;
    const categoryMatch = filterCategory === 'all' || r.category === filterCategory;
    const searchMatch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.id.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && deptMatch && categoryMatch && searchMatch;
  });

  const deptStats = {
    total: filteredRequests.length,
    inProgress: filteredRequests.filter(r => r.status === 'in-progress').length,
    completed: filteredRequests.filter(r => r.status === 'completed').length,
    rejected: filteredRequests.filter(r => r.status === 'rejected').length,
  };

  const deptBgMap: Record<string, string> = {
    [departments[0]]: 'bg-blue-50/80',
    [departments[1]]: 'bg-emerald-50/80',
    [departments[2]]: 'bg-violet-50/80',
    [departments[3]]: 'bg-amber-50/80',
    [departments[4]]: 'bg-rose-50/80',
    [departments[5]]: 'bg-cyan-50/80',
  };

  const deptTabActiveMap: Record<string, string> = {
    [departments[0]]: 'bg-blue-600 text-white shadow-blue-200',
    [departments[1]]: 'bg-emerald-600 text-white shadow-emerald-200',
    [departments[2]]: 'bg-violet-600 text-white shadow-violet-200',
    [departments[3]]: 'bg-amber-600 text-white shadow-amber-200',
    [departments[4]]: 'bg-rose-600 text-white shadow-rose-200',
    [departments[5]]: 'bg-cyan-600 text-white shadow-cyan-200',
  };

  const pageBg = filterDept !== 'all' ? deptBgMap[filterDept] || 'bg-surface' : 'bg-surface';

  return (
    <div className={cn("p-8 space-y-8 max-w-7xl mx-auto w-full min-h-screen transition-colors duration-300", pageBg)}>
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline">{TEXTS.REQUEST_LIST.TITLE}</h2>
          <p className="text-on-surface-variant font-medium">{TEXTS.REQUEST_LIST.SUBTITLE}</p>
        </div>
        <div className="flex items-center gap-3">

          <button 
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm shadow-md hover:bg-primary-container transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{TEXTS.REQUEST_LIST.NEW_REQUEST}</span>
          </button>
        </div>
      </section>

      {/* Department Tabs */}
      <section className="overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max px-1 py-1 bg-white/60 backdrop-blur-sm rounded-2xl w-fit shadow-sm">
          <button
            onClick={() => setFilterDept('all')}
            className={cn(
              "px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap",
              filterDept === 'all'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            )}
          >
            전체 업무
          </button>
          {departments.map(dept => (
            <button
              key={dept}
              onClick={() => setFilterDept(dept)}
              className={cn(
                "px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap shadow-md",
                filterDept === dept
                  ? deptTabActiveMap[dept] || 'bg-primary text-white shadow-primary/20'
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              {dept}
            </button>
          ))}
        </div>
      </section>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">전체 요청</div>
            <div className="text-2xl font-black text-on-surface font-headline">{deptStats.total}</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">진행중</div>
            <div className="text-2xl font-black text-on-surface font-headline">{deptStats.inProgress}</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">완료</div>
            <div className="text-2xl font-black text-on-surface font-headline">{deptStats.completed}</div>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">반려</div>
            <div className="text-2xl font-black text-on-surface font-headline">{deptStats.rejected}</div>
          </div>
        </div>
      </section>

      {/* Filters & Search */}
      <section className="bg-surface-container-low p-4 rounded-2xl flex flex-wrap items-center gap-4 border border-outline-variant/10">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input 
            type="text"
            placeholder={TEXTS.COMMON.SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-none rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:ring-2 focus:ring-primary/20 shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-on-surface-variant" />
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white border-none rounded-xl text-sm font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm min-w-[120px]"
          >
            <option value="all">전체 상태</option>
            {Object.entries(TEXTS.STATUSES).map(([key, value]) => (
              <option key={key} value={key.toLowerCase().replace('_', '-')}>{value}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-on-surface-variant" />
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border-none rounded-xl text-sm font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm min-w-[120px]"
          >
            <option value="all">전체 카테고리</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 shadow-sm border border-outline-variant/5">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-on-surface">최근 30일</span>
        </div>

        <div className="ml-auto text-xs font-bold text-on-surface-variant bg-surface-container-high px-3 py-1.5 rounded-lg">
          {TEXTS.REQUEST_LIST.TOTAL_COUNT.replace('{count}', filteredRequests.length.toString())}
        </div>
      </section>

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.REQUEST_LIST.TABLE.TITLE}</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">요청자</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.REQUEST_LIST.TABLE.DEPT}</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.REQUEST_LIST.TABLE.TARGET_DEPT}</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.REQUEST_LIST.TABLE.ASSIGNEE}</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest">{TEXTS.COMMON.STATUS}</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">{TEXTS.COMMON.PRIORITY}</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center">마감 기한</th>
                <th className="px-6 py-4 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">{TEXTS.REQUEST_LIST.TABLE.LAST_UPDATED}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filteredRequests.length > 0 ? (
                filteredRequests.map((req) => {
                  const lastHistory = req.history[req.history.length - 1];
                  const lastUpdated = lastHistory ? new Date(lastHistory.changedAt).toLocaleDateString() : req.createdAt;

                  return (
                    <tr 
                      key={req.id} 
                      className="group hover:bg-surface-container-low transition-colors cursor-pointer"
                      onClick={() => navigate(`/requests/${req.id}`)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-mono font-bold text-primary"></span>
                          <div className="font-bold text-on-surface text-sm group-hover:text-primary transition-colors">
                            <span className="mr-2 px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold uppercase whitespace-nowrap">{req.category}</span>
                            {req.title}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-bold text-on-surface">{req.requesterName}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-2 py-1 rounded bg-secondary/10 text-secondary text-xs font-bold whitespace-nowrap">
                          {req.department}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold whitespace-nowrap w-fit">
                            {req.targetDepartment}
                          </span>
                          {req.ccDepartment && (
                            <span className="px-2 py-1 rounded bg-surface-container-high text-on-surface-variant text-[10px] font-bold whitespace-nowrap w-fit">
                              참조: {req.ccDepartment}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        {req.assignee ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface">
                              {req.assignee.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-on-surface">{req.assignee.name}</span>
                              <span className="text-xs text-on-surface-variant">{req.assignee.department}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic font-medium">{TEXTS.REQUEST_DETAIL.UNASSIGNED}</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight border",
                          req.status === 'in-progress' ? 'bg-tertiary-container text-on-tertiary-container border-on-tertiary-container/20' :
                          req.status === 'submitted' || req.status === 'reviewing' ? 'bg-surface-variant text-on-surface-variant border-outline-variant/30' :
                          req.status === 'completed' || req.status === 'approved' ? 'bg-secondary-container text-on-secondary-container border-on-secondary-container/20' :
                          req.status === 'rejected' ? 'bg-error-container text-on-error-container border-on-error-container/20' :
                          'bg-outline-variant text-outline border-outline/20'
                        )}>
                          {TEXTS.STATUSES[req.status.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn(
                          "inline-block w-2.5 h-2.5 rounded-full",
                          req.priority === 'high' ? 'bg-error' :
                          req.priority === 'medium' ? 'bg-secondary' :
                          'bg-primary-fixed-dim'
                        )} title={req.priority}></span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {req.dueDate && (
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-bold whitespace-nowrap",
                            getDueDateStatus(req.dueDate, req.status) === 'overdue' ? 'bg-error-container text-on-error-container' :
                            getDueDateStatus(req.dueDate, req.status) === 'imminent' ? 'bg-tertiary-container text-on-tertiary-container' :
                            'bg-surface-container-high text-on-surface-variant'
                          )}>
                            {req.dueDate}
                            {getDueDateStatus(req.dueDate, req.status) === 'overdue' && ' (지연)'}
                            {getDueDateStatus(req.dueDate, req.status) === 'imminent' && ' (임박)'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-right text-xs font-bold text-on-surface-variant">{lastUpdated}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                        <Search className="w-8 h-8" />
                      </div>
                      <div className="text-on-surface font-bold">
                        {filterDept !== 'all' ? `${filterDept} 요청이 없습니다.` : "선택한 조건에 맞는 요청이 없습니다."}
                      </div>
                      <button 
                        onClick={() => {
                          setFilterDept('all');
                          setFilterStatus('all');
                          setSearchQuery('');
                        }}
                        className="text-sm text-primary font-bold hover:underline"
                      >
                        필터 초기화
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-8 py-5 border-t border-outline-variant/10">
          <div className="text-xs font-bold text-on-surface-variant">
            결과 표시 <span className="text-on-surface">{filteredRequests.length > 0 ? 1 : 0} - {filteredRequests.length}</span> / {filteredRequests.length}
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-50" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-xs shadow-sm">1</button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-all disabled:opacity-50" disabled>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
