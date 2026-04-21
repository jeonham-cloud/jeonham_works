import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSchedule } from '../contexts/ScheduleContext';
import { ChevronLeft, ChevronRight, Utensils, ExternalLink, Calendar as CalendarIcon, Users } from 'lucide-react';
import { cn } from '../lib/utils';

export default function LunchCalendar() {
  const { currentUser } = useAuth();
  const { lunchOrders, toggleLunchOrder } = useSchedule();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const isPastDeadline = (targetDateStr: string) => {
    const now = new Date();
    const target = new Date(targetDateStr);
    const deadline = new Date(target);
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(15, 0, 0, 0); // 3 PM the day before
    return now.getTime() > deadline.getTime();
  };

  const WEEKS = ['일', '월', '화', '수', '목', '금', '토'];

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Group orders by date
  const ordersByDate = lunchOrders.reduce((acc, order) => {
    if (!acc[order.date]) acc[order.date] = [];
    acc[order.date].push(order);
    return acc;
  }, {} as Record<string, typeof lunchOrders>);

  const myOrdersThisMonth = lunchOrders.filter(o => 
    o.userId === currentUser?.id && 
    new Date(o.date).getMonth() === month &&
    new Date(o.date).getFullYear() === year
  ).length;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline flex items-center gap-3">
            <Utensils className="w-8 h-8 text-primary" />
            먹어볼까? (점심 달력)
          </h2>
          <p className="text-on-surface-variant font-medium mt-2">
            구내식당(정기배송 도시락) 점심 식사를 신청하고 취소할 수 있습니다.<br/>
            <span className="text-error font-bold text-sm tracking-tight">* 신청 및 취소 마감: 식사일 전날 오후 3시</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-primary/10 text-primary font-bold rounded-lg border border-primary/20 flex items-center gap-2">
            <Users className="w-4 h-4" />
            나의 이번 달 신청: {myOrdersThisMonth}건
          </div>
          <a 
            href="https://www.foodboxkr.co.kr/menu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest text-on-surface rounded-xl font-bold text-sm shadow-sm hover:bg-surface-variant transition-all border border-outline-variant/20"
          >
            식단 확인하기
            <ExternalLink className="w-4 h-4 text-on-surface-variant" />
          </a>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <div className="flex items-center gap-4">
            <button 
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface-variant"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-black text-on-surface font-headline min-w-[120px] text-center">
              {year}년 {month + 1}월
            </h3>
            <button 
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-all text-on-surface-variant"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all"
          >
            오늘로 이동
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 border-b border-outline-variant/10 bg-surface-container-low/50">
          {WEEKS.map((week, i) => (
            <div key={week} className={cn(
              "py-3 text-center text-xs font-black uppercase tracking-widest border-r border-outline-variant/10 last:border-0",
              i === 0 ? "text-error" : i === 6 ? "text-secondary" : "text-on-surface-variant"
            )}>
              {week}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-[minmax(140px,_auto)]">
          {blanks.map(b => (
            <div key={`blank-${b}`} className="border-r border-b border-outline-variant/10 bg-surface-container-lowest/30 p-2"></div>
          ))}
          
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
            const dayOfWeek = new Date(year, month, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            
            const orders = ordersByDate[dateStr] || [];
            const hasMyOrder = orders.some(o => o.userId === currentUser?.id);
            const pastDeadline = isPastDeadline(dateStr);

            return (
              <div 
                key={day} 
                className={cn(
                  "border-r border-b border-outline-variant/10 p-3 flex flex-col gap-2 relative group transition-colors",
                  isWeekend ? "bg-surface-container-lowest/50" : "bg-white hover:bg-slate-50/50"
                )}
              >
                <div className="flex items-center justify-between pointer-events-none">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full",
                    isToday ? "bg-primary text-white" : 
                    dayOfWeek === 0 ? "text-error" : 
                    dayOfWeek === 6 ? "text-secondary" : 
                    "text-on-surface font-medium"
                  )}>
                    {day}
                  </span>
                  
                  {!isWeekend && (
                    <span className="text-xs font-bold text-on-surface-variant/50">
                      신청자 {orders.length}명
                    </span>
                  )}
                </div>

                {!isWeekend && (
                  <div className="mt-1 flex-1 flex flex-col gap-2">
                    <button
                      onClick={() => toggleLunchOrder(dateStr)}
                      disabled={pastDeadline}
                      className={cn(
                        "w-full py-2 rounded-lg text-xs font-bold transition-all border",
                        hasMyOrder 
                          ? pastDeadline 
                            ? "bg-primary/20 text-primary border-transparent opacity-70 cursor-not-allowed" 
                            : "bg-primary text-white shadow-md shadow-primary/20 border-transparent hover:bg-primary-container"
                          : pastDeadline
                            ? "bg-surface-container-low text-on-surface-variant border-transparent opacity-50 cursor-not-allowed"
                            : "bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container-high hover:border-outline-variant/50"
                      )}
                    >
                      {hasMyOrder 
                        ? pastDeadline ? "신청완료 (마감)" : "취소하기"
                        : pastDeadline ? "마감됨" : "신청하기"
                      }
                    </button>

                    <div className="flex flex-wrap gap-1 mt-auto">
                      {orders.map(order => (
                        <span 
                          key={order.id} 
                          className={cn(
                            "px-1.5 py-0.5 rounded text-xs font-bold",
                            order.userId === currentUser?.id ? "bg-primary/10 text-primary" : "bg-surface-container-low text-on-surface-variant"
                          )}
                          title={new Date(order.createdAt).toLocaleString()}
                        >
                          {order.userName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {isWeekend && (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-xs font-medium text-on-surface-variant/30 italic">휴일</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
