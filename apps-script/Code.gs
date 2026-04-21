/**
 * 복음의전함 업무요청 시스템 - Google Apps Script 백엔드
 * 
 * 이 스크립트를 Google Apps Script 에디터에 붙여넣고 웹 앱으로 배포하세요.
 * 배포 설정:
 *   - 실행 사용자: 나 (본인)
 *   - 액세스 권한: 모든 사용자
 * 
 * 필수 서비스:
 *   - Google Sheets API (자동 활성화됨)
 *   - Google Chat API (고급 서비스에서 활성화 필요 - 1:1 DM 용)
 */

// ============================================================
// 설정 - 아래 값을 실제 값으로 교체하세요
// ============================================================
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE'; // Google Sheets ID
const CHAT_WEBHOOK_URL = 'https://chat.googleapis.com/v1/spaces/AAQAIk--LT0/messages?key=AIzaSyDdI0hCZtE6vySjMm-WEfRq3CPzqKqqsHI&token=FXAFDtPU0NIs_Foh6r0gDPFNUsbPkecxqPA7rb7EEDE';

// ============================================================
// 초기 설정 - 처음 한 번만 실행
// ============================================================
function setupSheets() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  const sheets = {
    'users': ['id', 'email', 'name', 'role', 'department', 'avatar', 'active', 'createdAt'],
    'requests': ['id', 'title', 'description', 'requesterId', 'requesterName', 'requesterAvatar', 'department', 'targetDepartment', 'ccDepartment', 'category', 'priority', 'status', 'dueDate', 'createdAt', 'assigneeId', 'assigneeName', 'assigneeDept', 'assigneeRole'],
    'comments': ['id', 'requestId', 'authorId', 'authorName', 'authorAvatar', 'content', 'createdAt', 'updatedAt'],
    'history': ['id', 'requestId', 'actorName', 'actorRole', 'fromStatus', 'toStatus', 'comment', 'changedAt'],
    'notifications': ['id', 'userId', 'message', 'requestId', 'createdAt', 'read'],
    'settings': ['key', 'value'],
    'schedules': ['id', 'title', 'department', 'description', 'startDate', 'endDate', 'participants', 'createdBy', 'workType'],
    'lunchOrders': ['id', 'date', 'userId', 'userName', 'createdAt'],
    'system_logs': ['id', 'actionType', 'entityType', 'entityId', 'entityTitle', 'actorId', 'actorName', 'createdAt'],
  };

  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    } else {
      sheet.clear();
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  });

  // 기본 설정값 삽입
  const settingsSheet = ss.getSheetByName('settings');
  const defaultSettings = [
    ['departments', JSON.stringify(['콘텐츠 개발실', '대외협력실', '전략기획실', '경영지원실', '후원성장지원팀', '뉴브랜드'])],
    ['categories', JSON.stringify(['일반', '디자인', '영상/미디어', '웹/IT', '마케팅/광고'])],
    ['homeScreen', 'dashboard'],
    ['showNotifications', 'true'],
    ['useLogoutConfirm', 'true'],
    ['dateFormat', 'YYYY-MM-DD'],
    ['chatWebhookUrl', CHAT_WEBHOOK_URL],
  ];
  settingsSheet.getRange(2, 1, defaultSettings.length, 2).setValues(defaultSettings);

  // 기본 Sheet1 삭제
  const defaultSheet = ss.getSheetByName('Sheet1') || ss.getSheetByName('시트1');
  if (defaultSheet) {
    try { ss.deleteSheet(defaultSheet); } catch(e) { /* ignore */ }
  }

  Logger.log('✅ 모든 시트가 성공적으로 초기화되었습니다.');
}

// ============================================================
// HTTP 핸들러
// ============================================================
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    let payload;
    if (e.postData) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.payload) {
      // GET 방식: ?payload=JSON문자열
      payload = JSON.parse(decodeURIComponent(e.parameter.payload));
    } else {
      payload = e.parameter;
    }

    const action = payload.action;
    let result;

    switch (action) {
      // Users
      case 'getUsers': result = getUsers(); break;
      case 'upsertUser': result = upsertUser(payload); break;
      case 'updateUser': result = updateUser_(payload); break;
      case 'deleteUser': result = deleteUser_(payload); break;
      case 'toggleUserStatus': result = toggleUserStatus_(payload); break;

      // Requests
      case 'getRequests': result = getRequests(); break;
      case 'addRequest': result = addRequest_(payload); break;
      case 'updateRequestStatus': result = updateRequestStatus_(payload); break;
      case 'assignTask': result = assignTask_(payload); break;
      case 'deleteRequest': result = deleteRequest_(payload); break;

      // Comments
      case 'getComments': result = getComments_(payload); break;
      case 'addComment': result = addComment_(payload); break;
      case 'editComment': result = editComment_(payload); break;
      case 'deleteComment': result = deleteComment_(payload); break;

      // History
      case 'getHistory': result = getHistory_(payload); break;

      // Notifications
      case 'getNotifications': result = getNotifications_(payload); break;
      case 'addNotification': result = addNotification_(payload); break;
      case 'markAsRead': result = markAsRead_(payload); break;
      case 'markAllAsRead': result = markAllAsRead_(payload); break;

      // Settings
      case 'getSettings': result = getSettings_(); break;
      case 'updateSetting': result = updateSetting_(payload); break;

      // Schedules
      case 'getSchedules': result = getSchedules_(); break;
      case 'addSchedule': result = addSchedule_(payload); break;
      case 'updateSchedule': result = updateSchedule_(payload); break;
      case 'deleteSchedule': result = deleteSchedule_(payload); break;

      // Lunch Orders
      case 'getLunchOrders': result = getLunchOrders_(); break;
      case 'toggleLunchOrder': result = toggleLunchOrder_(payload); break;

      // System Logs
      case 'getLogs': result = getLogs_(); break;
      case 'addLog': result = addLog_(payload); break;

      // Chat
      case 'sendChatNotification': result = sendChatNotification_(payload); break;

      // Bootstrap - 앱 시작 시 모든 데이터를 한 번에 반환
      case 'bootstrap': result = bootstrap_(payload); break;

      default:
        result = { success: false, error: 'Unknown action: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// 시트 헬퍼 함수
// ============================================================
function getSheet_(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function getSheetData_(sheetName) {
  const sheet = getSheet_(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });
    return obj;
  });
}

function appendRow_(sheetName, obj) {
  const sheet = getSheet_(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
}

function updateRow_(sheetName, keyCol, keyVal, updates) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyCol);
  if (keyIndex < 0) return false;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][keyIndex]) === String(keyVal)) {
      Object.entries(updates).forEach(([key, val]) => {
        const colIndex = headers.indexOf(key);
        if (colIndex >= 0) {
          sheet.getRange(i + 1, colIndex + 1).setValue(val);
        }
      });
      return true;
    }
  }
  return false;
}

function deleteRow_(sheetName, keyCol, keyVal) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyCol);
  if (keyIndex < 0) return false;

  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyIndex]) === String(keyVal)) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

function deleteRows_(sheetName, keyCol, keyVal) {
  const sheet = getSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIndex = headers.indexOf(keyCol);
  if (keyIndex < 0) return 0;

  let count = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    if (String(data[i][keyIndex]) === String(keyVal)) {
      sheet.deleteRow(i + 1);
      count++;
    }
  }
  return count;
}

// ============================================================
// Users
// ============================================================
function getUsers() {
  const users = getSheetData_('users');
  // active 필드를 boolean으로 변환
  users.forEach(u => {
    u.active = (u.active === true || u.active === 'true' || u.active === 'TRUE');
  });
  return { success: true, data: users };
}

function upsertUser(payload) {
  const { email, name, avatar } = payload;
  const users = getSheetData_('users');
  const existing = users.find(u => u.email === email);

  if (existing) {
    // 업데이트: 이름, 아바타만 갱신 (역할/부서는 관리자가 설정)
    updateRow_('users', 'email', email, { name, avatar });
    existing.name = name;
    existing.avatar = avatar;
    existing.active = (existing.active === true || existing.active === 'true' || existing.active === 'TRUE');
    return { success: true, data: existing };
  }

  // 신규 사용자 생성
  const newUser = {
    id: 'user-' + Date.now(),
    email,
    name,
    role: 'user',
    department: '',
    avatar: avatar || '',
    active: 'true',
    createdAt: new Date().toISOString().split('T')[0],
  };
  appendRow_('users', newUser);
  newUser.active = true;
  return { success: true, data: newUser, isNew: true };
}

function updateUser_(payload) {
  const { userId, updates } = payload;
  // active 필드 문자열 변환
  if (updates.active !== undefined) {
    updates.active = String(updates.active);
  }
  const updated = updateRow_('users', 'id', userId, updates);
  return { success: updated };
}

function deleteUser_(payload) {
  const { userId } = payload;
  const deleted = deleteRow_('users', 'id', userId);
  return { success: deleted };
}

function toggleUserStatus_(payload) {
  const { userId } = payload;
  const users = getSheetData_('users');
  const user = users.find(u => u.id === userId);
  if (!user) return { success: false, error: 'User not found' };

  const currentActive = (user.active === true || user.active === 'true' || user.active === 'TRUE');
  const newActive = !currentActive;
  updateRow_('users', 'id', userId, { active: String(newActive) });
  return { success: true, active: newActive };
}

// ============================================================
// Requests
// ============================================================
function getRequests() {
  const requests = getSheetData_('requests');
  // 각 request에 comments와 history를 조합
  const allComments = getSheetData_('comments');
  const allHistory = getSheetData_('history');

  requests.forEach(req => {
    req.comments = allComments.filter(c => c.requestId === req.id);
    req.history = allHistory.filter(h => h.requestId === req.id);
    // assignee 객체 복원
    if (req.assigneeId) {
      req.assignee = {
        id: req.assigneeId,
        name: req.assigneeName,
        department: req.assigneeDept,
        role: req.assigneeRole,
      };
    } else {
      req.assignee = null;
    }
    // 카테고리 기본값
    if (!req.category) req.category = '일반';
    // attachments (빈 배열)
    req.attachments = [];
  });

  // 최신순 정렬
  requests.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { success: true, data: requests };
}

function addRequest_(payload) {
  const { request, actorId, actorName } = payload;

  // requests 시트에 추가
  const flatReq = {
    id: request.id,
    title: request.title,
    description: request.description,
    requesterId: request.requesterId,
    requesterName: request.requesterName,
    requesterAvatar: request.requesterAvatar || '',
    department: request.department,
    targetDepartment: request.targetDepartment,
    ccDepartment: request.ccDepartment || '',
    category: request.category || '일반',
    priority: request.priority,
    status: request.status,
    dueDate: request.dueDate,
    createdAt: request.createdAt,
    assigneeId: '',
    assigneeName: '',
    assigneeDept: '',
    assigneeRole: '',
  };
  appendRow_('requests', flatReq);

  // history 추가
  const histItem = {
    id: 'h-' + Date.now(),
    requestId: request.id,
    actorName: actorName,
    actorRole: payload.actorRole || 'user',
    fromStatus: 'none',
    toStatus: request.status,
    comment: '',
    changedAt: new Date().toISOString(),
  };
  appendRow_('history', histItem);

  // system_logs
  addLog_({
    actionType: 'create',
    entityType: 'request',
    entityId: request.id,
    entityTitle: request.title,
    actorId,
    actorName,
  });

  // 알림 (담당 부서 매니저에게)
  const users = getSheetData_('users');
  const deptsToNotify = [request.targetDepartment, request.ccDepartment].filter(Boolean);
  deptsToNotify.forEach(dept => {
    const managers = users.filter(u => u.department === dept && u.role === 'manager');
    managers.forEach(m => {
      if (m.id !== actorId) {
        addNotification_({
          userId: m.id,
          message: `[신규 요청] ${actorName}님이 "${request.title}" 요청을 등록했습니다.`,
          requestId: request.id,
        });
      }
    });
  });

  // Google Chat 웹훅
  sendWebhook_(`📋 *새 업무 요청*\n제목: ${request.title}\n요청자: ${actorName}\n담당부서: ${request.targetDepartment}\n우선순위: ${request.priority}`);

  return { success: true };
}

function updateRequestStatus_(payload) {
  const { requestId, toStatus, comment, actorName, actorRole, actorId } = payload;

  // 현재 상태 확인
  const requests = getSheetData_('requests');
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, error: 'Request not found' };

  const fromStatus = req.status;
  updateRow_('requests', 'id', requestId, { status: toStatus });

  // history 추가
  appendRow_('history', {
    id: 'h-' + Date.now(),
    requestId,
    actorName,
    actorRole,
    fromStatus,
    toStatus,
    comment: comment || '',
    changedAt: new Date().toISOString(),
  });

  // 알림
  const statusNames = {
    'draft': '작성중', 'submitted': '제출', 'reviewing': '검토중',
    'rejected': '반려', 'approved': '승인', 'in-progress': '진행중',
    'completed': '완료', 'on-hold': '보류'
  };
  const msg = `요청 [${req.title}]의 상태가 [${statusNames[toStatus] || toStatus}]으로 변경되었습니다.`;

  if (req.requesterId !== actorId) {
    addNotification_({ userId: req.requesterId, message: msg, requestId });
  }
  if (req.assigneeId && req.assigneeId !== actorId && req.assigneeId !== req.requesterId) {
    addNotification_({ userId: req.assigneeId, message: msg, requestId });
  }

  // 웹훅
  sendWebhook_(`🔄 *상태 변경*\n[${req.title}] ${statusNames[fromStatus] || fromStatus} → ${statusNames[toStatus] || toStatus}\n변경자: ${actorName}`);

  return { success: true };
}

function assignTask_(payload) {
  const { requestId, userId, actorId, actorName } = payload;

  const requests = getSheetData_('requests');
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, error: 'Request not found' };

  const oldAssigneeId = req.assigneeId;

  if (userId) {
    const users = getSheetData_('users');
    const user = users.find(u => u.id === userId);
    if (!user) return { success: false, error: 'User not found' };

    updateRow_('requests', 'id', requestId, {
      assigneeId: user.id,
      assigneeName: user.name,
      assigneeDept: user.department,
      assigneeRole: user.role,
    });

    if (userId !== actorId) {
      addNotification_({
        userId,
        message: `[업무 배정] [${req.title}] 업무의 담당자로 지정되었습니다.`,
        requestId,
      });
    }
    if (req.requesterId !== actorId) {
      addNotification_({
        userId: req.requesterId,
        message: `[담당자 지정] [${req.title}] 업무의 담당자가 [${user.name}]님으로 설정되었습니다.`,
        requestId,
      });
    }

    sendWebhook_(`👤 *담당자 배정*\n[${req.title}] → ${user.name}님`);
  } else {
    // 담당자 해제
    updateRow_('requests', 'id', requestId, {
      assigneeId: '',
      assigneeName: '',
      assigneeDept: '',
      assigneeRole: '',
    });
  }

  if (oldAssigneeId && oldAssigneeId !== userId && oldAssigneeId !== actorId) {
    addNotification_({
      userId: oldAssigneeId,
      message: `[업무 해제] [${req.title}] 업무의 담당자 지정이 해제되었습니다.`,
      requestId,
    });
  }

  return { success: true };
}

function deleteRequest_(payload) {
  const { requestId, actorId, actorName } = payload;

  const requests = getSheetData_('requests');
  const req = requests.find(r => r.id === requestId);
  if (!req) return { success: false, error: 'Request not found' };

  deleteRow_('requests', 'id', requestId);
  deleteRows_('comments', 'requestId', requestId);
  deleteRows_('history', 'requestId', requestId);

  addLog_({
    actionType: 'delete',
    entityType: 'request',
    entityId: requestId,
    entityTitle: req.title,
    actorId,
    actorName,
  });

  return { success: true };
}

// ============================================================
// Comments
// ============================================================
function getComments_(payload) {
  const { requestId } = payload;
  const comments = getSheetData_('comments').filter(c => c.requestId === requestId);
  return { success: true, data: comments };
}

function addComment_(payload) {
  const { requestId, comment, actorId, actorName } = payload;

  appendRow_('comments', {
    id: comment.id,
    requestId,
    authorId: comment.authorId,
    authorName: comment.authorName,
    authorAvatar: comment.authorAvatar || '',
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: '',
  });

  // 알림
  const requests = getSheetData_('requests');
  const req = requests.find(r => r.id === requestId);
  if (req) {
    const truncated = comment.content.substring(0, 30) + (comment.content.length > 30 ? '...' : '');
    const msg = `[${req.title}] ${actorName}님이 댓글을 남겼습니다: "${truncated}"`;

    if (req.requesterId !== actorId) {
      addNotification_({ userId: req.requesterId, message: msg, requestId });
    }
    if (req.assigneeId && req.assigneeId !== actorId && req.assigneeId !== req.requesterId) {
      addNotification_({ userId: req.assigneeId, message: msg, requestId });
    }
  }

  return { success: true };
}

function editComment_(payload) {
  const { commentId, newContent } = payload;
  updateRow_('comments', 'id', commentId, {
    content: newContent,
    updatedAt: new Date().toISOString(),
  });
  return { success: true };
}

function deleteComment_(payload) {
  const { commentId } = payload;
  deleteRow_('comments', 'id', commentId);
  return { success: true };
}

// ============================================================
// History
// ============================================================
function getHistory_(payload) {
  const { requestId } = payload;
  const history = getSheetData_('history').filter(h => h.requestId === requestId);
  return { success: true, data: history };
}

// ============================================================
// Notifications
// ============================================================
function getNotifications_(payload) {
  const { userId } = payload;
  const notifs = getSheetData_('notifications')
    .filter(n => n.userId === userId)
    .map(n => ({
      ...n,
      read: (n.read === true || n.read === 'true' || n.read === 'TRUE'),
    }));
  notifs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { success: true, data: notifs };
}

function addNotification_(payload) {
  const { userId, message, requestId } = payload;

  const notifId = 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  appendRow_('notifications', {
    id: notifId,
    userId,
    message,
    requestId: requestId || '',
    createdAt: new Date().toISOString(),
    read: 'false',
  });

  // 1:1 DM 시도 (Google Chat API)
  try {
    const users = getSheetData_('users');
    const user = users.find(u => u.id === userId);
    if (user && user.email) {
      sendDirectMessage_(user.email, message);
    }
  } catch(e) {
    Logger.log('DM 전송 실패 (Chat API 미설정): ' + e.toString());
  }

  return { success: true, id: notifId };
}

function markAsRead_(payload) {
  const { notificationId } = payload;
  updateRow_('notifications', 'id', notificationId, { read: 'true' });
  return { success: true };
}

function markAllAsRead_(payload) {
  const { userId } = payload;
  const sheet = getSheet_('notifications');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const userIdIdx = headers.indexOf('userId');
  const readIdx = headers.indexOf('read');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][userIdIdx]) === String(userId) &&
        String(data[i][readIdx]) !== 'true') {
      sheet.getRange(i + 1, readIdx + 1).setValue('true');
    }
  }
  return { success: true };
}

// ============================================================
// Settings
// ============================================================
function getSettings_() {
  const data = getSheetData_('settings');
  const settings = {};
  data.forEach(row => {
    let value = row.value;
    // JSON 값 파싱 시도
    try {
      const parsed = JSON.parse(value);
      value = parsed;
    } catch(e) { /* not JSON, keep string */ }
    // boolean 변환
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    settings[row.key] = value;
  });
  return { success: true, data: settings };
}

function updateSetting_(payload) {
  const { key, value } = payload;
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);

  const sheet = getSheet_('settings');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyIdx = headers.indexOf('key');

  let found = false;
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyIdx] === key) {
      sheet.getRange(i + 1, headers.indexOf('value') + 1).setValue(serialized);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([key, serialized]);
  }

  return { success: true };
}

// ============================================================
// Schedules
// ============================================================
function getSchedules_() {
  const schedules = getSheetData_('schedules');
  schedules.forEach(s => {
    // participants를 배열로 변환
    if (typeof s.participants === 'string') {
      try { s.participants = JSON.parse(s.participants); }
      catch(e) { s.participants = s.participants ? s.participants.split(',') : []; }
    }
  });
  return { success: true, data: schedules };
}

function addSchedule_(payload) {
  const { schedule } = payload;
  const flat = {
    ...schedule,
    participants: JSON.stringify(schedule.participants || []),
  };
  appendRow_('schedules', flat);
  return { success: true };
}

function updateSchedule_(payload) {
  const { scheduleId, updates } = payload;
  if (updates.participants) {
    updates.participants = JSON.stringify(updates.participants);
  }
  updateRow_('schedules', 'id', scheduleId, updates);
  return { success: true };
}

function deleteSchedule_(payload) {
  const { scheduleId } = payload;
  deleteRow_('schedules', 'id', scheduleId);
  return { success: true };
}

// ============================================================
// Lunch Orders
// ============================================================
function getLunchOrders_() {
  const orders = getSheetData_('lunchOrders');
  return { success: true, data: orders };
}

function toggleLunchOrder_(payload) {
  const { date, userId, userName } = payload;

  const orders = getSheetData_('lunchOrders');
  const existing = orders.find(o => o.date === date && o.userId === userId);

  if (existing) {
    deleteRow_('lunchOrders', 'id', existing.id);
    return { success: true, action: 'removed' };
  } else {
    const newOrder = {
      id: 'lo-' + Date.now() + '-' + userId,
      date,
      userId,
      userName,
      createdAt: new Date().toISOString(),
    };
    appendRow_('lunchOrders', newOrder);
    return { success: true, action: 'added' };
  }
}

// ============================================================
// System Logs
// ============================================================
function getLogs_() {
  const logs = getSheetData_('system_logs');
  logs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { success: true, data: logs };
}

function addLog_(payload) {
  const logEntry = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
    actionType: payload.actionType,
    entityType: payload.entityType || 'request',
    entityId: payload.entityId,
    entityTitle: payload.entityTitle,
    actorId: payload.actorId,
    actorName: payload.actorName,
    createdAt: new Date().toISOString(),
  };
  appendRow_('system_logs', logEntry);
  return { success: true };
}

// ============================================================
// Google Chat 알림
// ============================================================
function sendWebhook_(message) {
  try {
    UrlFetchApp.fetch(CHAT_WEBHOOK_URL, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: message }),
    });
  } catch(e) {
    Logger.log('Webhook 전송 실패: ' + e.toString());
  }
}

function sendDirectMessage_(userEmail, messageText) {
  // Google Chat API를 사용한 1:1 DM
  // 사전 요구사항: Google Chat API 고급 서비스 활성화
  try {
    // DM 스페이스 생성 또는 찾기
    const space = Chat.Spaces.setup({
      space: { spaceType: 'DIRECT_MESSAGE' },
      memberships: [{
        member: {
          name: 'users/' + userEmail,
          type: 'HUMAN'
        }
      }]
    });

    // 메시지 전송
    Chat.Spaces.Messages.create(
      { text: '📢 ' + messageText },
      space.name
    );

    Logger.log('DM 전송 성공: ' + userEmail);
  } catch(e) {
    Logger.log('DM 전송 실패 (' + userEmail + '): ' + e.toString());
  }
}

function sendChatNotification_(payload) {
  const { type, message, userEmail } = payload;

  if (type === 'webhook') {
    sendWebhook_(message);
  } else if (type === 'dm' && userEmail) {
    sendDirectMessage_(userEmail, message);
  } else {
    // 둘 다
    sendWebhook_(message);
    if (userEmail) sendDirectMessage_(userEmail, message);
  }

  return { success: true };
}

// ============================================================
// Bootstrap - 앱 시작 시 모든 초기 데이터를 한 번에 반환
// ============================================================
function bootstrap_(payload) {
  const { userId } = payload || {};

  const users = getSheetData_('users');
  users.forEach(function(u) {
    u.active = (u.active === true || u.active === 'true' || u.active === 'TRUE');
  });

  var requestsRaw = getSheetData_('requests');
  var allComments = getSheetData_('comments');
  var allHistory = getSheetData_('history');

  var requests = requestsRaw.map(function(req) {
    req.comments = allComments.filter(function(c) { return c.requestId === req.id; });
    req.history = allHistory.filter(function(h) { return h.requestId === req.id; });
    req.assignee = req.assigneeId ? {
      id: req.assigneeId,
      name: req.assigneeName,
      department: req.assigneeDept,
      role: req.assigneeRole,
    } : null;
    if (!req.category) req.category = '일반';
    req.attachments = [];
    return req;
  });
  requests.sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });

  var settingsData = getSheetData_('settings');
  var settings = {};
  settingsData.forEach(function(row) {
    var value = row.value;
    try { value = JSON.parse(value); } catch(e) {}
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    settings[row.key] = value;
  });

  var notifications = [];
  if (userId) {
    notifications = getSheetData_('notifications')
      .filter(function(n) { return n.userId === userId; })
      .map(function(n) {
        n.read = (n.read === true || n.read === 'true' || n.read === 'TRUE');
        return n;
      });
    notifications.sort(function(a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)); });
  }

  return {
    success: true,
    data: { users: users, requests: requests, settings: settings, notifications: notifications }
  };
}
