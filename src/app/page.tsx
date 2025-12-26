'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore'; // Zustand 스토어 임포트

export default function HomePage() {
  const router = useRouter();
  const loadData = useStore((state) => state.loadData); // 서버 데이터를 로드하는 액션

  useEffect(() => {
    // 1. 앱 진입 시 서버(data.json)로부터 최신 데이터를 불러옵니다.
    const initializeApp = async () => {
      try {
        await loadData();
        console.log("초기 데이터 로드 완료");
      } catch (error) {
        console.error("초기 데이터 로드 중 오류 발생:", error);
      }

      // 2. 데이터 로드 후 로그인 상태에 따라 페이지 이동
      const token = localStorage.getItem('auth_token');
      if (token) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    };

    initializeApp();
  }, [router, loadData]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          도서 시스템 데이터를 불러오는 중...
        </p>
      </div>
    </div>
  );
}