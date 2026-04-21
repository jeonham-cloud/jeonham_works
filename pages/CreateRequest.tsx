import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRequest } from '../contexts/RequestContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Check, Info, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Priority } from '../types';
import { TEXTS } from '../constants/texts';

export default function CreateRequest() {
  const { currentUser } = useAuth();
  const { addRequest, categories, addCategory, editCategory, deleteCategory } = useRequest();
  const { departments } = useSettings();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('일반');
  const [categoryMode, setCategoryMode] = useState<'none' | 'add' | 'edit' | 'delete'>('none');
  const [tempCategory, setTempCategory] = useState('');
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [ccDepartment, setCcDepartment] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // departments 로드 후 초기 targetDepartment 설정
  React.useEffect(() => {
    if (departments.length > 0 && !targetDepartment) {
      setTargetDepartment(departments[0]);
    }
  }, [departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !dueDate || !targetDepartment) return;

    setIsSubmitting(true);

    try {
      await addRequest({
        title,
        description,
        requesterId: currentUser!.id,
        requesterName: currentUser!.name,
        department: currentUser!.department,
        targetDepartment,
        ccDepartment: ccDepartment || undefined,
        category,
        priority,
        status: 'submitted',
        dueDate,
        attachments: [],
      });

      navigate('/requests');
    } catch (error) {
      alert("요청 등록 중 오류가 발생했습니다.");
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 lg:p-12 max-w-4xl mx-auto w-full">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold font-headline text-primary tracking-tight mb-2">{TEXTS.CREATE_REQUEST.TITLE}</h2>
        <p className="text-secondary font-medium max-w-2xl">{TEXTS.CREATE_REQUEST.SUBTITLE}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-6">
        <section className="md:col-span-4 bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
          <div className="space-y-8">
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2" htmlFor="req-title">{TEXTS.CREATE_REQUEST.FIELD_TITLE}</label>
              <input 
                id="req-title"
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={TEXTS.CREATE_REQUEST.FIELD_TITLE_PLACEHOLDER}
                className="w-full bg-transparent border-t-0 border-l-0 border-r-0 border-b border-outline-variant py-3 text-lg font-medium text-on-surface focus:ring-0 focus:border-primary transition-all placeholder:text-outline-variant/50"
                required
              />
            </div>
            
            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2" htmlFor="req-category">카테고리</label>
              <div className="flex items-center gap-2">
                {categoryMode === 'none' ? (
                  <>
                    <select 
                      id="req-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-surface-container-low border-none rounded-lg px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    
                    {(currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
                      <div className="flex shrink-0 gap-1">
                        <button 
                          type="button"
                          onClick={() => {
                            setTempCategory(category);
                            setCategoryMode('edit');
                          }}
                          className="w-11 h-11 bg-surface-container-low text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-surface-container-highest hover:text-primary transition-all shadow-sm"
                          title="카테고리 수정"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            if (categories.length <= 1) {
                              alert("최소 1개의 카테고리는 유지해야 합니다.");
                              return;
                            }
                            setCategoryMode('delete');
                          }}
                          className="w-11 h-11 bg-surface-container-low text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-surface-container-highest hover:text-error transition-all shadow-sm"
                          title="카테고리 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setTempCategory('');
                            setCategoryMode('add');
                          }}
                          className="w-11 h-11 bg-primary/10 text-primary rounded-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                          title="새 카테고리 추가"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </>
                ) : categoryMode === 'delete' ? (
                  <div className="flex items-center justify-between w-full bg-error/10 border border-error/30 rounded-lg px-4 py-1.5 text-sm">
                    <span className="font-bold text-error break-all mr-2 line-clamp-1">'{category}' 삭제?</span>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          deleteCategory(category);
                          setCategory(categories.find(c => c !== category) || '');
                          setCategoryMode('none');
                        }}
                        className="w-11 h-11 bg-error text-white rounded-lg flex items-center justify-center hover:bg-error/90 transition-all shadow-sm"
                        title="확인"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryMode('none')}
                        className="w-11 h-11 bg-surface-variant text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-outline-variant hover:text-on-surface transition-all shadow-sm"
                        title="취소"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="text"
                      className="w-full bg-surface-container-lowest border border-primary/30 rounded-lg px-4 py-3 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary transition-all"
                      placeholder={categoryMode === 'add' ? "새 카테고리 이름" : "카테고리명 수정"}
                      value={tempCategory}
                      onChange={e => setTempCategory(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (!tempCategory.trim()) return;
                          if (categoryMode === 'add') {
                            addCategory(tempCategory.trim());
                            setCategory(tempCategory.trim());
                          } else {
                            editCategory(category, tempCategory.trim());
                            setCategory(tempCategory.trim());
                          }
                          setCategoryMode('none');
                        } else if (e.key === 'Escape') {
                          setCategoryMode('none');
                        }
                      }}
                    />
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (!tempCategory.trim()) return;
                          if (categoryMode === 'add') {
                            addCategory(tempCategory.trim());
                            setCategory(tempCategory.trim());
                          } else {
                            editCategory(category, tempCategory.trim());
                            setCategory(tempCategory.trim());
                          }
                          setCategoryMode('none');
                        }}
                        className="w-11 h-11 bg-emerald-500 text-white rounded-lg flex items-center justify-center hover:bg-emerald-600 transition-all shadow-sm"
                        title="저장"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryMode('none')}
                        className="w-11 h-11 bg-surface-variant text-on-surface-variant rounded-lg flex items-center justify-center hover:bg-outline-variant hover:text-on-surface transition-all shadow-sm"
                        title="취소"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="group">
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2" htmlFor="req-desc">{TEXTS.CREATE_REQUEST.FIELD_DESC}</label>
              <textarea 
                id="req-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={TEXTS.CREATE_REQUEST.FIELD_DESC_PLACEHOLDER}
                className="w-full bg-transparent border border-outline-variant/30 rounded-lg p-4 text-on-surface focus:ring-0 focus:border-primary transition-all placeholder:text-outline-variant/50 resize-none"
                rows={6}
                required
              />
            </div>
          </div>
        </section>

        <section className="md:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-6 font-headline">배정 및 일정</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">요청자</label>
                <div className="w-full bg-surface-container-low rounded-lg px-4 py-2.5 text-sm font-medium text-primary">
                  {currentUser.name}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{TEXTS.COMMON.DEPARTMENT}</label>
                <div className="w-full bg-surface-container-low rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface">
                  {currentUser.department}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{TEXTS.COMMON.TARGET_DEPARTMENT}</label>
                <select 
                  value={targetDepartment}
                  onChange={(e) => setTargetDepartment(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">참조 부서</label>
                <select 
                  value={ccDepartment}
                  onChange={(e) => setCcDepartment(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">선택 안함</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">{TEXTS.CREATE_REQUEST.FIELD_DUE_DATE}</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-surface-container-low border-none rounded-lg px-4 py-2.5 text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/10">
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">{TEXTS.CREATE_REQUEST.FIELD_PRIORITY}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                <button 
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "py-2.5 text-xs font-bold rounded transition-all",
                    priority === p 
                      ? "bg-primary text-white shadow-md shadow-primary/20" 
                      : "bg-surface-container-low text-secondary hover:bg-secondary-container"
                  )}
                >
                  {TEXTS.PRIORITIES[p.toUpperCase() as keyof typeof TEXTS.PRIORITIES]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="md:col-span-6 flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
          <div className="flex items-center gap-2 text-on-surface-variant/60">
            <Info className="w-4 h-4" />
            <span className="text-xs font-medium">{TEXTS.CREATE_REQUEST.SECURITY_NOTICE}</span>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 md:flex-none px-10 py-4 bg-surface-container-highest text-on-secondary-container font-bold rounded-lg hover:bg-surface-dim transition-all text-sm"
            >
              {TEXTS.COMMON.CANCEL}
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex-1 md:flex-none px-12 py-4 signature-gradient text-white font-bold rounded-lg shadow-xl shadow-primary/20 hover:opacity-90 transition-all text-sm disabled:opacity-50"
            >
              {isSubmitting ? '등록 중...' : TEXTS.CREATE_REQUEST.SUBMIT_BTN}
            </button>
          </div>
        </section>
      </form>
    </div>
  );
}
