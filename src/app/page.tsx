'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function HomePage() {
  const router = useRouter();
  
  // 스토어에서 loadData 함수만 선택적으로 가져옵니다.
  const loadData = useStore((state) => state.loadData);

  const initializeApp = useCallback(async () => {
    // loadData가 존재하고 함수인지 확실히 체크
    if (typeof loadData === 'function') {
      try {
        await loadData();
        console.log("초기 데이터 로드 성공");
      } catch (error) {
        console.error("데이터 로드 중 에러:", error);
      }
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [loadData, router]);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

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