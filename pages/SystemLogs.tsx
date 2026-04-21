import React, { useState, useEffect, useCallback } from 'react';
import { apiCall } from '../lib/googleApi';
import { SystemLog } from '../types';
import { ScrollText, Download, Calendar, Trash2, PlusCircle, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export default function SystemLogs() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState<string>(''); // YYYY-MM-DD

  const loadLogs = useCallback(async () => {
    try {
      const result = await apiCall<{ data: SystemLog[] }>('getLogs');
      setLogs(result.data);
    } catch (e) {
      console.error('로그 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filteredLogs = logs.filter(log => {
    if (!filterDate) return true;
    return String(log.createdAt).startsWith(filterDate);
  });

  const handleDownloadTxt = () => {
    if (filteredLogs.length === 0) {
      alert("다운로드할 로그가 없습니다.");
      return;
    }

    const lines = filteredLogs.map(log => {
      const date = new Date(log.createdAt).toLocaleString();
      const action = log.actionType === 'create' ? '생성' : '삭제';
      return `[${date}] [${action}] ${log.actorName}(${log.actorId}) - [${log.entityTitle}] (${log.entityId})`;
    });

    const fileContent = lines.join('\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = filterDate ? filterDate : 'all';
    link.download = `system_logs_${dateStr}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8 animate-fade-in delay-100">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface font-headline flex items-center gap-3">
            <ScrollText className="w-8 h-8 text-primary" />
            시스템 로그
          </h2>
          <p className="text-on-surface-variant font-medium text-sm">시스템 내에서 발생한 주요 활동(생성/삭제) 이력을 확인하고 추출합니다.</p>
        </div>
        <button 
          onClick={handleDownloadTxt}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-container-highest text-on-secondary-container rounded-lg font-bold text-sm transition-all hover:bg-secondary-fixed shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>텍스트 파일 다운로드</span>
        </button>
      </section>

      {/* Filter */}
      <section className="bg-white/60 backdrop-blur-sm p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-3 bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 flex-1 md:flex-none">
          <Calendar className="w-5 h-5 text-on-surface-variant" />
          <input 
            type="date" 
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-transparent border-none outline-none text-sm font-bold text-on-surface focus:ring-0 w-full"
          />
          {filterDate && (
            <button 
              onClick={() => setFilterDate('')}
              className="text-xs text-on-surface-variant hover:text-error font-medium transition-colors"
            >
              초기화
            </button>
          )}
        </div>
        <p className="text-sm font-bold text-on-surface-variant ml-auto">
          조회 결과: <span className="text-primary">{filteredLogs.length}</span>건
        </p>
      </section>

      {/* Logs Table */}
      <section className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-on-surface-variant font-bold">로그를 불러오는 중입니다...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <Search className="w-12 h-12 text-outline mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">조회된 로그가 없습니다</h3>
            <p className="text-on-surface-variant">선택한 날짜에 해당하는 활동 이력이 존재하지 않습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-lowest/50 text-on-surface-variant text-xs font-black uppercase tracking-wider">
                  <th className="px-6 py-4 rounded-tl-3xl">일시</th>
                  <th className="px-6 py-4">구분</th>
                  <th className="px-6 py-4">대상 활동내역</th>
                  <th className="px-6 py-4 rounded-tr-3xl">실행자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-container-lowest/80 transition-colors group">
                    <td className="px-6 py-4 text-sm text-on-surface-variant font-medium">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {log.actionType === 'create' ? (
                        <div className="flex items-center gap-1.5 text-primary text-sm font-bold bg-primary-container/30 w-fit px-2.5 py-1 rounded-full">
                          <PlusCircle className="w-4 h-4" />
                          <span>생성</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-error text-sm font-bold bg-error-container/30 w-fit px-2.5 py-1 rounded-full">
                          <Trash2 className="w-4 h-4" />
                          <span>삭제</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                          {log.entityTitle}
                        </span>
                        <span className="text-xs text-on-surface-variant font-mono">
                          ID: {log.entityId}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface font-semibold">
                      {log.actorName}
                      <span className="text-xs text-on-surface-variant ml-1 font-mono">({log.actorId})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
