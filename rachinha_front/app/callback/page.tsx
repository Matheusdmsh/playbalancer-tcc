'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/services/api';
import * as authService from '@/services/authService';
import { GoogleAuthModal } from '@/components/google-auth-modal';

const LoadingSpinner = () => (
  <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-500 border-t-transparent"></div>
);

const AuthCallbackPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const incomingTempToken = searchParams.get('temp_token');

    if (token) {
      authService.setToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setTimeout(() => {
        router.push('/user/home');
      }, 500);
    } else if (incomingTempToken) {
        // Redireciona para o login para lidar com o setup inline
        router.push(`/login?temp_token=${incomingTempToken}`);
    } else {
      console.error("Callback do Google sem token. Redirecionando para /login.");
      setError("Falha na autenticação. Redirecionando para a página de login...");
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  }, [searchParams, router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-black text-center">
      {tempToken && (
          <GoogleAuthModal 
            tempToken={tempToken} 
            onClose={() => {
                setTempToken(null);
                router.push('/login');
            }} 
          />
      )}
      {error ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-red-500">{error}</p>
        </>
      ) : (
        <>
          <LoadingSpinner />
          <p className="mt-4 text-lg font-medium text-white">Autenticando, por favor aguarde...</p>
          <p className="text-sm text-gray-300">Quase lá!</p>
        </>
      )}
    </div>
  );
};

export default AuthCallbackPage;