'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export default function SyncManager() {
  const { loadFromServer, saveToServer, nodes, edges } = useStore();

  // 1. 실시간 읽기: 3초마다 서버에서 데이터를 가져옴
  useEffect(() => {
    loadFromServer(); // 첫 로드
    const interval = setInterval(() => {
      loadFromServer();
    }, 3000); 
    return () => clearInterval(interval);
  }, [loadFromServer]);

  // 2. 실시간 쓰기: 로컬 상태(nodes, edges)가 변하면 서버에 저장
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const timeout = setTimeout(() => {
        saveToServer();
      }, 500); // 너무 빈번한 저장을 막기 위해 0.5초 디바운스
      return () => clearTimeout(timeout);
    }
  }, [nodes, edges, saveToServer]);

  return null; // 화면에 그리는 건 없음
}