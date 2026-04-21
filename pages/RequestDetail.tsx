import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useRequest } from '../contexts/RequestContext';
import { 
  ChevronDown, AlertTriangle, FileText, Image as ImageIcon, 
  BarChart3, Send, CheckCircle2, Copy, User as UserIcon, 
  Eye, Settings, LogOut, AlertCircle, Clock, ArrowLeft, Building2, Paperclip, MessageSquare,
  Calendar, History, X, Check, UserPlus, Pencil, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TEXTS } from '../constants/texts';
import { Status } from '../types';

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { addNotification } = useNotification();
  const { requests, updateRequestStatus, addComment, editComment, deleteComment, assignTask, deleteRequest } = useRequest();
  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Status | null>(null);
  const [statusComment, setStatusComment] = useState('');

  const request = requests.find(r => r.id === id);

  if (!request) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-on-surface">{TEXTS.REQUEST_DETAIL.NOT_FOUND}</h2>
        <button 
          onClick={() => navigate('/requests')}
          className="mt-4 text-primary font-bold hover:underline"
        >
          {TEXTS.REQUEST_DETAIL.BACK_TO_LIST}
        </button>
      </div>
    );
  }

  const handleStatusChangeClick = (newStatus: Status) => {
    setPendingStatus(newStatus);
    setIsModalOpen(true);
  };

  const confirmStatusChange = () => {
    if (pendingStatus) {
      updateRequestStatus(request.id, pendingStatus, statusComment);
      setIsModalOpen(false);
      setPendingStatus(null);
      setStatusComment('');
    }
  };

  const handleAssignUser = (userId: string | null) => {
    assignTask(request.id, userId);
    setIsAssignModalOpen(false);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    addComment(request.id, comment);
    
    // Parse mentions like @username or @realname
    const mentionRegex = /@([a-zA-Z0-9가-힣]+)/g;
    const matches = [...comment.matchAll(mentionRegex)];
    if (matches.length > 0) {
      matches.forEach(match => {
        const mention = match[1];
        const mentionedUser = users.find(u => u.name === mention || u.email === mention);
        if (mentionedUser && mentionedUser.id !== currentUser.id) {
          addNotification(
            mentionedUser.id, 
            `${currentUser.name}님이 [${request.title}] 업무에서 멘션했습니다: "${comment.substring(0, 20)}..."`, 
            request.id
          );
        }
      });
    }
    
    setComment('');
  };

  const handleDeleteRequest = async () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRequest = async () => {
    await deleteRequest(request.id);
    navigate('/requests');
  };

  const startEditingComment = (id: string, content: string) => {
    setEditingCommentId(id);
    setEditingContent(content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const saveEditedComment = async (commentId: string) => {
    if (!editingContent.trim()) return;
    await editComment(request.id, commentId, editingContent);
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    await deleteComment(request.id, commentId);
  };

  const handleCopyHistory = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("내용이 클립보드에 복사되었습니다.");
    }).catch(() => {
      alert("복사에 실패했습니다.");
    });
  };

  const role = currentUser.role;
  const status = request.status;

  const showReviewBtn = (role === 'admin' || role === 'manager' || role === 'finance') && status === 'submitted';
  const showApproveRejectBtns = (role === 'admin' || role === 'manager' || role === 'finance') && (status === 'submitted' || status === 'reviewing');
  const showStartBtn = (role === 'admin' || role === 'manager' || role === 'finance') && status === 'approved';
  const showCompleteBtn = (role === 'admin' || role === 'manager' || role === 'finance') && status === 'in-progress';
  const showSubmitBtn = (role === 'user' || role === 'admin') && status === 'draft';
  const showResubmitBtn = (role === 'user' || role === 'admin') && status === 'rejected' && request.requesterId === currentUser.id;
  const canAssign = role === 'admin' || role === 'manager';

  return (
    <main className="flex-1 overflow-y-auto bg-surface-container-low p-8">
      {/* Status Change Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant/20">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary font-headline">{TEXTS.REQUEST_DETAIL.MODAL.TITLE}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/10">
                <div className="flex-1 text-center">
                  <div className="text-xs text-on-surface-variant font-bold uppercase">{TEXTS.REQUEST_DETAIL.HISTORY.FROM}</div>
                  <div className="text-sm font-bold text-on-surface">{TEXTS.STATUSES[status.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}</div>
                </div>
                <div className="text-primary">→</div>
                <div className="flex-1 text-center">
                  <div className="text-xs text-on-surface-variant font-bold uppercase">{TEXTS.REQUEST_DETAIL.HISTORY.TO}</div>
                  <div className="text-sm font-bold text-primary">{pendingStatus && TEXTS.STATUSES[pendingStatus.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}</div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">{TEXTS.REQUEST_DETAIL.MODAL.COMMENT_LABEL}</label>
                <textarea 
                  value={statusComment}
                  onChange={(e) => setStatusComment(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  rows={3}
                  placeholder="변경 사유를 입력하세요..."
                />
              </div>
            </div>
            <div className="p-6 bg-surface-container-low/50 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white text-on-surface-variant font-bold rounded-xl border border-outline-variant/20 hover:bg-slate-50 transition-all"
              >
                {TEXTS.REQUEST_DETAIL.MODAL.CANCEL}
              </button>
              <button 
                onClick={confirmStatusChange}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-container transition-all"
              >
                {TEXTS.REQUEST_DETAIL.MODAL.CONFIRM}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-error/20">
            <div className="p-6 border-b border-error/10 flex items-center gap-3 bg-error/5">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-error font-headline">업무 요청 삭제</h3>
            </div>
            <div className="p-6">
              <p className="text-sm text-on-surface font-medium leading-relaxed">
                정말 이 업무 요청을 완전히 삭제하시겠습니까?
                <br /><span className="text-error mt-2 block">이 작업은 취소하거나 되돌릴 수 없습니다.</span>
              </p>
            </div>
            <div className="p-6 bg-surface-container-low/50 flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 py-3 bg-white text-on-surface-variant font-bold rounded-xl border border-outline-variant/20 hover:bg-slate-50 transition-all"
              >
                취소
              </button>
              <button 
                onClick={confirmDeleteRequest}
                className="flex-1 py-3 bg-error text-white font-bold rounded-xl shadow-lg hover:bg-error/90 transition-all"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign User Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-outline-variant/20">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary font-headline">{TEXTS.REQUEST_DETAIL.ASSIGN_BTN}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-on-surface-variant hover:text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 max-h-[400px] overflow-y-auto space-y-2">
              <button
                onClick={() => handleAssignUser(null)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all text-left border border-transparent hover:border-outline-variant/20"
              >
                <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                  <X className="w-5 h-5 text-on-surface-variant" />
                </div>
                <div>
                  <div className="text-sm font-bold text-on-surface-variant">{TEXTS.REQUEST_DETAIL.UNASSIGNED}</div>
                </div>
              </button>
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssignUser(user.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-all text-left border border-transparent hover:border-outline-variant/20",
                    request.assignee?.id === user.id && "bg-primary/5 border-primary/20"
                  )}
                >
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <div className="text-sm font-bold text-on-surface">{user.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.5 bg-surface-container-high rounded text-xs font-bold text-on-surface-variant uppercase tracking-tighter">
                        {user.department}
                      </span>
                      <span className="text-xs text-on-surface-variant font-medium">
                        {TEXTS.ROLES[user.role.toUpperCase() as keyof typeof TEXTS.ROLES]}
                      </span>
                    </div>
                  </div>
                  {request.assignee?.id === user.id && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-on-surface-variant font-bold hover:text-primary transition-colors group mb-6"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>{TEXTS.REQUEST_DETAIL.BACK_TO_LIST}</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-on-surface-variant mb-2">
              <span className="text-xs font-bold tracking-widest uppercase"></span>
              <span className="h-1 w-1 bg-outline-variant rounded-full"></span>
              <span className="text-xs font-medium">{TEXTS.COMMON.CREATED_AT}: {request.createdAt}</span>
              <span className="h-1 w-1 bg-outline-variant rounded-full"></span>
              <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase whitespace-nowrap tracking-wider">
                {request.category}
              </span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-primary leading-tight max-w-2xl font-headline">
              {request.title}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border",
              request.status === 'in-progress' ? 'bg-tertiary-container text-on-tertiary-container border-on-tertiary-container/20' :
              request.status === 'submitted' || request.status === 'reviewing' ? 'bg-surface-variant text-on-surface-variant border-outline-variant/30' :
              request.status === 'completed' || request.status === 'approved' ? 'bg-secondary-container text-on-secondary-container border-on-secondary-container/20' :
              request.status === 'rejected' ? 'bg-error-container text-on-error-container border-on-error-container/20' :
              'bg-outline-variant text-outline border-outline/20'
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                request.status === 'in-progress' ? 'bg-on-tertiary-container' :
                request.status === 'submitted' || request.status === 'reviewing' ? 'bg-on-surface-variant' :
                request.status === 'rejected' ? 'bg-on-error-container' :
                'bg-on-secondary-container'
              )}></span>
              {TEXTS.STATUSES[request.status.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}
            </div>
            
            <div className="flex gap-2">
              {(role === 'admin' || currentUser.id === request.requesterId) && (
                <button 
                  onClick={handleDeleteRequest}
                  className="px-4 py-2 bg-error/10 text-error font-bold rounded-lg hover:bg-error-container/30 transition-all text-sm border border-error/20 mr-2"
                >
                  요청 삭제
                </button>
              )}
              {showSubmitBtn && (
                <button 
                  onClick={() => handleStatusChangeClick('submitted')}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-container transition-all text-sm"
                >
                  {TEXTS.COMMON.SUBMIT}
                </button>
              )}
              {showResubmitBtn && (
                <button 
                  onClick={() => handleStatusChangeClick('submitted')}
                  className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-container transition-all text-sm"
                >
                  {TEXTS.REQUEST_DETAIL.RESUBMIT_BTN}
                </button>
              )}
              {showReviewBtn && (
                <button 
                  onClick={() => handleStatusChangeClick('reviewing')}
                  className="px-6 py-2 bg-surface-container-highest text-primary font-bold rounded-lg border border-primary/20 hover:bg-primary/5 transition-all text-sm"
                >
                  {TEXTS.REQUEST_DETAIL.REVIEW_BTN}
                </button>
              )}
              {showApproveRejectBtns && (
                <>
                  <button 
                    onClick={() => handleStatusChangeClick('rejected')}
                    className="px-4 py-2 bg-surface-container-highest text-error font-bold rounded-lg hover:bg-error-container/20 transition-all text-sm"
                  >
                    {TEXTS.REQUEST_DETAIL.REJECT_BTN}
                  </button>
                  <button 
                    onClick={() => handleStatusChangeClick('approved')}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg shadow-md hover:bg-primary-container transition-all text-sm"
                  >
                    {TEXTS.REQUEST_DETAIL.APPROVE_BTN}
                  </button>
                </>
              )}
              {showStartBtn && (
                <button 
                  onClick={() => handleStatusChangeClick('in-progress')}
                  className="px-6 py-2 bg-tertiary text-white font-bold rounded-lg shadow-md hover:bg-tertiary-container transition-all text-sm"
                >
                  {TEXTS.REQUEST_DETAIL.START_BTN}
                </button>
              )}
              {showCompleteBtn && (
                <button 
                  onClick={() => handleStatusChangeClick('completed')}
                  className="px-6 py-2 signature-gradient text-white font-bold rounded-lg shadow-md hover:opacity-90 transition-all text-sm"
                >
                  {TEXTS.REQUEST_DETAIL.COMPLETE_BTN}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-6">{TEXTS.REQUEST_DETAIL.LABEL_DESC}</h3>
            <div className="text-on-surface leading-relaxed text-sm font-medium whitespace-pre-wrap">
              {request.description}
            </div>
          </section>

          <section className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col border border-outline-variant/10">
            <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary font-headline">{TEXTS.REQUEST_DETAIL.LABEL_COMMENTS}</h3>
              <span className="px-2 py-1 bg-surface-container-low rounded-full text-xs font-bold text-on-surface-variant">업데이트 {request.comments.length}건</span>
            </div>
            <div className="p-8 space-y-6 max-h-[500px] overflow-y-auto">
              {request.comments.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant/50">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm font-medium">아직 등록된 의견이 없습니다.</p>
                </div>
              ) : (
                request.comments.map((com) => (
                  <div key={com.id} className="flex gap-4 group">
                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                      {com.authorAvatar ? (
                        <img src={com.authorAvatar} alt={com.authorName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-on-surface-variant" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-primary">{com.authorName}</span>
                          <span className="text-xs text-on-surface-variant">{new Date(com.createdAt).toLocaleString()}</span>
                          {(com as any).updatedAt && <span className="text-[10px] text-on-surface-variant opacity-70">(수정됨)</span>}
                        </div>
                        
                        {(currentUser.id === com.authorId || currentUser.role === 'admin') && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditingComment(com.id, com.content)}
                              className="p-1.5 hover:bg-primary/10 text-on-surface-variant hover:text-primary rounded-lg transition-all"
                              title="수정"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteComment(com.id)}
                              className="p-1.5 hover:bg-error/10 text-on-surface-variant hover:text-error rounded-lg transition-all"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingCommentId === com.id ? (
                        <div className="space-y-2">
                          <textarea 
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-white border border-primary/30 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={cancelEditingComment} className="px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">취소</button>
                            <button onClick={() => saveEditedComment(com.id)} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg shadow-sm hover:bg-primary-container transition-all">저장</button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-surface-container-low p-4 rounded-xl rounded-tl-none border border-outline-variant/5">
                          <p className="text-sm text-on-surface whitespace-pre-wrap">{com.content}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleCommentSubmit} className="p-6 bg-surface-container-low/50 border-t border-outline-variant/10">
              <div className="bg-white rounded-lg p-2 shadow-sm flex items-end gap-2 border border-outline-variant/20 focus-within:border-primary transition-all">
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full border-none focus:ring-0 text-sm py-2 px-3 bg-transparent resize-none" 
                  placeholder={TEXTS.REQUEST_DETAIL.COMMENT_PLACEHOLDER} 
                  rows={2}
                ></textarea>
                <button type="submit" className="p-3 bg-primary text-white rounded-lg hover:bg-primary-container transition-all shadow-md">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </section>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <h3 className="text-sm font-bold text-primary mb-6 uppercase tracking-wider font-headline">{TEXTS.REQUEST_DETAIL.SUMMARY}</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">{TEXTS.REQUEST_DETAIL.LABEL_REQUESTER}</div>
                  <div className="text-sm font-bold text-on-surface">{request.requesterName}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">{TEXTS.REQUEST_DETAIL.LABEL_DEPT}</div>
                  <div className="inline-flex px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-xs font-bold mt-0.5">
                    {request.department}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">{TEXTS.REQUEST_DETAIL.LABEL_TARGET_DEPT}</div>
                  <div className="inline-flex px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold mt-0.5">
                    {request.targetDepartment}
                  </div>
                </div>
              </div>

              {request.ccDepartment && (
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                    <Eye className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">참조 부서</div>
                    <div className="inline-flex px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant text-xs font-bold mt-0.5">
                      {request.ccDepartment}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">{TEXTS.REQUEST_DETAIL.LABEL_DUE_DATE}</div>
                  <div className="text-sm font-bold text-on-surface">{request.dueDate}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center">
                  <AlertTriangle className={cn(
                    "w-5 h-5",
                    request.priority === 'high' ? 'text-error' : 'text-secondary'
                  )} />
                </div>
                <div>
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">{TEXTS.COMMON.PRIORITY}</div>
                  <div className={cn(
                    "text-sm font-bold",
                    request.priority === 'high' ? 'text-error' : 'text-on-surface'
                  )}>
                    {TEXTS.PRIORITIES[request.priority.toUpperCase() as keyof typeof TEXTS.PRIORITIES]}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">{TEXTS.REQUEST_DETAIL.LABEL_ASSIGNEE}</div>
                  {canAssign && (
                    <button 
                      onClick={() => setIsAssignModalOpen(true)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      {TEXTS.REQUEST_DETAIL.ASSIGN_BTN}
                    </button>
                  )}
                </div>
                {request.assignee ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{request.assignee.name}</div>
                      <div className="text-xs text-on-surface-variant font-medium">{request.assignee.department}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-on-surface-variant italic py-2">
                    {TEXTS.REQUEST_DETAIL.UNASSIGNED}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Status History Timeline */}
          <section className="bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-bold text-primary uppercase tracking-wider font-headline">{TEXTS.REQUEST_DETAIL.HISTORY.TITLE}</h3>
            </div>
            <div className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20">
              {[...request.history].reverse().map((item, idx) => (
                <div key={item.id} className="relative pl-10">
                  <div className={cn(
                    "absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center z-10 border-2 border-white shadow-sm",
                    item.toStatus === 'approved' || item.toStatus === 'completed' ? 'bg-secondary text-white' :
                    item.toStatus === 'rejected' ? 'bg-error text-white' :
                    item.toStatus === 'in-progress' ? 'bg-tertiary text-white' :
                    'bg-surface-container-high text-on-surface-variant'
                  )}>
                    {item.toStatus === 'approved' ? <Check className="w-4 h-4" /> : 
                     item.toStatus === 'completed' ? <CheckCircle2 className="w-4 h-4" /> :
                     item.toStatus === 'rejected' ? <X className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-primary">{item.actorName}</span>
                      <span className="text-xs text-on-surface-variant font-medium">{new Date(item.changedAt).toLocaleString()}</span>
                    </div>
                    <div className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter mb-1">
                      {TEXTS.ROLES[item.actorRole.toUpperCase() as keyof typeof TEXTS.ROLES]}
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-on-surface">
                      {item.fromStatus !== 'none' && (
                        <>
                          <span className="line-through opacity-50">{TEXTS.STATUSES[item.fromStatus.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}</span>
                          <span className="text-primary">→</span>
                        </>
                      )}
                      <span className="font-bold text-primary">{TEXTS.STATUSES[item.toStatus.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}</span>
                      
                      <button 
                        onClick={() => handleCopyHistory(`[${TEXTS.STATUSES[item.toStatus.toUpperCase().replace('-', '_') as keyof typeof TEXTS.STATUSES]}] ${item.comment || ''}`)}
                        className="ml-auto text-on-surface-variant/50 hover:text-primary transition-colors p-1"
                        title="내용 복사"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {item.comment && (
                      <div className="mt-2 p-3 bg-surface-container-low rounded-lg border border-outline-variant/10 text-xs text-on-surface italic">
                        "{item.comment}"
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>


        </div>
      </div>
    </main>
  );
}
