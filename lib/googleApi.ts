/**
 * Google API 클라이언트
 * Firebase를 대체하여 Google Apps Script Web App과 통신합니다.
 */

// ============================================================
// 설정 - 배포 후 실제 값으로 교체하세요
// ============================================================

// Google Apps Script Web App URL (배포 후 제공됨)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGuQ8L7d0s-FDvMObL_msQPCoR3PFaZJLZggep5hYgSf-QAFNhDNptt_V-KuZbN85IxQ/exec';

// Google OAuth Client ID (Google Cloud Console에서 생성)
const GOOGLE_CLIENT_ID = '516543508529-llr7i1nnnnis69oaou14ncagikt0dhkt.apps.googleusercontent.com';

// ============================================================
// API 호출 래퍼
// ============================================================
export async function apiCall<T = any>(action: string, params: Record<string, any> = {}): Promise<T> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...params }),
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`API 오류: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
    }

    return result as T;
  } catch (error: any) {
    console.error(`API 호출 실패 (${action}):`, error);
    throw error;
  }
}

// ============================================================
// Google Identity Services (GIS)
// ============================================================

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          revoke: (email: string, callback: () => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture: string;
  sub: string; // Google user ID
}

/**
 * JWT ID 토큰에서 사용자 정보 추출
 */
export function decodeJwt(token: string): GoogleUserProfile {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(jsonPayload);
}

/**
 * Google 로그인 초기화
 */
export function initializeGoogleLogin(callback: (profile: GoogleUserProfile) => void) {
  if (!window.google) {
    console.error('Google Identity Services SDK가 로드되지 않았습니다.');
    return;
  }

  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response: { credential: string }) => {
      const profile = decodeJwt(response.credential);
      callback(profile);
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

/**
 * Google 로그인 팝업 표시
 */
export function promptGoogleLogin() {
  if (!window.google) return;
  window.google.accounts.id.prompt();
}

/**
 * Google 로그인 버튼 렌더링
 */
export function renderGoogleButton(element: HTMLElement) {
  if (!window.google) return;
  window.google.accounts.id.renderButton(element, {
    theme: 'outline',
    size: 'large',
    width: 380,
    text: 'signin_with',
    shape: 'pill',
    locale: 'ko',
  });
}

/**
 * Google 로그아웃
 */
export function googleLogout(email: string) {
  if (!window.google) return;
  window.google.accounts.id.disableAutoSelect();
  window.google.accounts.id.revoke(email, () => {
    console.log('Google 세션 해제 완료');
  });
}

export { GOOGLE_CLIENT_ID };
