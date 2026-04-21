import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { useSettings } from '../contexts/SettingsContext';
import { Schedule } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, X, Clock, Users, Building2, Tag, Info, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Schedules() {
  const { users, currentUser } = useAuth();
  const { schedules, addSchedule, updateSchedule, deleteSchedule } = useSchedule();
  const { departments } = useSettings();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterDept, setFilterDept] = useState<string>('all');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<'list' | 'form'>('list');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  const COLOR_PALETTES = [
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-rose-100 text-rose-800 border-rose-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  ];

  const deptColors: Record<string, string> = useMemo(() => {
    const colors: Record<string, string> = {};
    departments.forEach((dept, index) => {
      colors[dept] = COLOR_PALETTES[index % COLOR_PALETTES.length];
    });
    return colors;
  }, [departments]);
  const defaultColor = 'bg-gray-100 text-gray-800 border-gray-200';

  // Form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState<string>(currentUser?.department || '');
  const [workType, setWorkType] = useState('회의');
  const [time, setTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([currentUser?.id || '']);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // departments 로드 후 초기 department 설정
  React.useEffect(() => {
    if (!department && departments.length > 0) {
      setDepartment(currentUser?.department || departments[0]);
    }
  }, [departments]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formattedSelectedDate = selectedDate ? 
    `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` 
    : '';

  const daySchedules = useMemo(() => {
    if (!formattedSelectedDate) return [];
    return schedules.filter(s => {
      const matchDept = filterDept === 'all' || s.department === filterDept;
      const matchDate = s.startDate.startsWith(formattedSelectedDate);
      return matchDept && matchDate;
    }).sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [schedules, filterDept, formattedSelectedDate]);

  const handleDateClick = (day: number) => {
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    setEditingSchedule(null);
    setSidebarMode('list');
    setIsSidebarOpen(true);
  };

  const openForm = (schedule: Schedule | null = null) => {
    setEditingSchedule(schedule);
    setSidebarMode('form');
    if (schedule) {
      setTitle(schedule.title);
      setDepartment(schedule.department);
      setWorkType(schedule.workType);
      const timeStr = schedule.startDate.split('T')[1] || '10:00';
      setTime(timeStr.substring(0, 5));
      setDescription(schedule.description || '');
      setSelectedParticipants(schedule.participants);
    } else {
      setTitle('');
      setDepartment(currentUser?.department || departments[0] || '');
      setWorkType('회의');
      setTime('10:00');
      setDescription('');
      setSelectedParticipants([currentUser?.id || '']);
      setUserSearchTerm('');
    }
  };

  const handleSave = () => {
    if (!title.trim() || !formattedSelectedDate) {
      alert("일정 내용(제목)을 입력해주세요.");
      return;
    }

    const isoDate = `${formattedSelectedDate}T${time}:00`;
    
    if (editingSchedule) {
      updateSchedule(editingSchedule.id, {
        title,
        department,
        workType,
        description,
        startDate: isoDate,
        participants: selectedParticipants
      });
    } else {
      addSchedule({
        title,
        department,
        workType,
        description,
        startDate: isoDate,
        endDate: isoDate,
        participants: selectedParticipants
      });
    }
    setSidebarMode('list');
  };

  const toggleParticipant = (userId: string) => {
    if (selectedParticipants.includes(userId)) {
      setSelectedParticipants(prev => prev.filter(id => id !== userId));
    } else {
      setSelectedParticipants(prev => [...prev, userId]);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full flex gap-8 h-[calc(100vh-80px)]">
      {/* Calendar View */}
      <div className={cn("flex-1 flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden transition-all", isSidebarOpen ? "hidden lg:flex lg:w-2/3" : "w-full")}>
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-extrabold text-primary font-headline flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-secondary" />
              부서별 일정
            </h2>
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm ml-4">
              <button onClick={prevMonth} className="p-1 hover:bg-surface-container-low rounded"><ChevronLeft className="w-5 h-5 text-on-surface-variant" /></button>
              <span className="font-bold text-on-surface px-4 min-w-[120px] text-center">
                {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-surface-container-low rounded"><ChevronRight className="w-5 h-5 text-on-surface-variant" /></button>
            </div>
          </div>
          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-white border-none rounded-xl text-sm font-bold px-4 py-2 focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
            >
              <option value="all">전체 부서</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-on-surface-variant uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4 auto-rows-fr h-[calc(100%-2rem)]">
            {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-transparent border border-transparent p-2 rounded-xl"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              
              const dayEvents = schedules.filter(s => {
                const matchDept = filterDept === 'all' || s.department === filterDept;
                return matchDept && s.startDate.startsWith(dateStr);
              }).sort((a, b) => a.startDate.localeCompare(b.startDate));
              
              const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === currentDate.getMonth();

              return (
                <div 
                  key={day} 
                  onClick={() => handleDateClick(day)}
                  className={cn(
                    "border border-outline-variant/10 rounded-xl p-2 cursor-pointer transition-all min-h-[80px] flex flex-col hover:border-primary/50 overflow-hidden",
                    isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-white"
                  )}
                >
                  <div className="text-right text-sm font-bold text-on-surface mb-2 px-1">
                    {day}
                  </div>
                  <div className="flex flex-col gap-1 overflow-y-auto no-scrollbar flex-1">
                    {dayEvents.map(event => (
                      <div key={event.id} className={cn("text-xs px-1.5 py-0.5 rounded font-medium truncate border", deptColors[event.department] || defaultColor)}>
                        {event.startDate.split('T')[1].substring(0,5)} {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar (Schedule List & Editor) */}
      <div className={cn(
        "flex flex-col bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 h-full overflow-hidden transition-all duration-300",
        isSidebarOpen ? "w-full lg:w-1/3 opacity-100 flex" : "w-0 opacity-0 hidden"
      )}>
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-primary text-white">
          <h3 className="font-bold text-lg">{formattedSelectedDate} 일정</h3>
          <button onClick={() => setIsSidebarOpen(false)} className="hover:bg-white/20 p-1 rounded-full"><X className="w-5 h-5"/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {sidebarMode === 'list' ? (
            <div className="space-y-4">
              <button onClick={() => openForm(null)} className="w-full signature-gradient text-white font-bold py-3.5 rounded-lg shadow-lg hover:opacity-90 flex items-center justify-center gap-2 transition-all">
                <Plus className="w-5 h-5" /> 새 일정 등록하기
              </button>
              
              <div className="pt-4">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">등록된 일정 ({daySchedules.length})</h4>
                {daySchedules.length > 0 ? (
                  <div className="space-y-3">
                    {daySchedules.map(sch => (
                      <div key={sch.id} onClick={() => openForm(sch)} className="bg-white border border-outline-variant/10 rounded-xl p-4 hover:border-primary/50 cursor-pointer flex justify-between items-center shadow-sm transition-all group">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors">{sch.title}</span>
                          <span className="text-xs text-on-surface-variant font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {sch.startDate.split('T')[1].substring(0,5)}
                          </span>
                        </div>
                        <span className={cn("text-xs px-2 py-1 rounded-md font-bold border", deptColors[sch.department] || defaultColor)}>
                          {sch.department}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-on-surface-variant/50 bg-surface-container-low rounded-xl border border-dashed border-outline-variant/20">
                    <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">등록된 일정이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button onClick={() => setSidebarMode('list')} className="text-sm font-bold text-primary hover:underline mb-2 block w-max">← 목록으로 돌아가기</button>
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{editingSchedule ? '일정 수정' : '새 일정 추가'}</h4>
              <div className="space-y-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block">내용</label>
                  <input 
                    type="text" value={title} onChange={e=>setTitle(e.target.value)}
                    className="w-full text-sm border-none bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30"
                    placeholder="일정 내역 입력"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block"><Clock className="w-3 h-3 inline mr-1"/>시간</label>
                    <input 
                      type="time" value={time} onChange={e=>setTime(e.target.value)}
                      className="w-full text-sm border-none bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block"><Tag className="w-3 h-3 inline mr-1"/>종류</label>
                    <input 
                      type="text" value={workType} onChange={e=>setWorkType(e.target.value)}
                      className="w-full text-sm border-none bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block"><Building2 className="w-3 h-3 inline mr-1"/>주관 부서</label>
                  <select 
                    value={department} onChange={e=>setDepartment(e.target.value)}
                    className="w-full text-sm border-none bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30"
                  >
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant uppercase mb-1 block"><Info className="w-3 h-3 inline mr-1"/>설명</label>
                  <textarea 
                    value={description} onChange={e=>setDescription(e.target.value)}
                    className="w-full text-sm border-none bg-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary/30 resize-none h-16"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      참여 인원 ({selectedParticipants.length}명)
                    </label>
                    <input
                      type="text"
                      placeholder="이름, 부서 검색..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="text-xs px-2 py-1 border border-outline-variant/20 bg-white rounded focus:ring-1 focus:ring-primary w-28 outline-none"
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 bg-white p-2 text-sm rounded-lg border-none shadow-inner">
                    {users
                      .filter(u => 
                        u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) || 
                        u.department.toLowerCase().includes(userSearchTerm.toLowerCase())
                      )
                      .map(u => (
                        <label key={u.id} className="flex items-center gap-2 p-1 hover:bg-surface-container-low rounded cursor-pointer">
                          <input type="checkbox" checked={selectedParticipants.includes(u.id)} onChange={() => toggleParticipant(u.id)} className="rounded text-primary"/>
                          <span className="font-bold">{u.name}</span>
                          <span className="text-xs text-on-surface-variant">{u.department}</span>
                        </label>
                      ))}
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  {editingSchedule && (
                    <button onClick={() => { if(window.confirm('삭제하시겠습니까?')){ deleteSchedule(editingSchedule.id); setSidebarMode('list'); } }} className="px-3 py-2 bg-error/10 text-error rounded-lg flex items-center justify-center hover:bg-error/20 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={handleSave} className="flex-1 signature-gradient text-white font-bold py-2 rounded-lg shadow-md hover:opacity-90 transition-all">
                    {editingSchedule ? '수정 사항 저장' : '등록하기'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
