import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleUserProfile, decodeJwt, GOOGLE_CLIENT_ID } from '../lib/googleApi';
import { AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleGoogleLogin = useCallback(async (profile: GoogleUserProfile) => {
    setError('');
    setIsLoading(true);
    try {
      await login(profile);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [login, navigate]);

  useEffect(() => {
    const initGSI = () => {
      if (!window.google || !googleBtnRef.current) {
        setTimeout(initGSI, 300);
        return;
      }

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response: { credential: string }) => {
          const profile = decodeJwt(response.credential);
          handleGoogleLogin(profile);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // One Tap (팝업 차단 없이 동작)
      window.google.accounts.id.prompt();

      // 버튼도 렌더링 (클릭하면 One Tap 재시도)
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'signin_with',
        shape: 'pill',
        locale: 'ko',
      });
    };

    initGSI();
  }, [handleGoogleLogin]);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
            <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="currentColor"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.8"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="currentColor" opacity="0.6"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity="0.9"/>
            </svg>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          복음의전함
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          업무요청 및 관리 시스템
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200 sm:rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-6">
                Google 계정으로 로그인하여 업무 시스템에 접근하세요.
              </p>
            </div>

            {/* Google 공식 버튼 */}
            <div className="flex justify-center min-h-[44px]">
              <div ref={googleBtnRef} id="google-signin-btn"></div>
            </div>

            {isLoading && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  로그인 처리 중...
                </div>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-400">Google Workspace</span>
              </div>
            </div>

            {/* 팝업 차단 시 안내 */}
            <div className="text-xs text-center text-slate-400 leading-relaxed space-y-1">
              <p>버튼을 클릭하거나 화면 상단의 Google 로그인 창을 이용하세요.</p>
              <p className="text-slate-300">최초 로그인 시 자동으로 계정이 생성됩니다.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
