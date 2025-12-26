'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

export default function SyncManager() {
  const loadData = useStore((state) => state.loadData);
  const saveData = useStore((state) => state.saveData);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  const isInitialMount = useRef(true);

  // 1. 읽기 최적화: 주기를 30초로 대폭 늘리고, 포커스 시에만 갱신 시도
  useEffect(() => {
    if (typeof loadData === 'function') {
      loadData(); // 최초 1회 실행
    }

    // 3초는 너무 빠릅니다. 30초~1분 정도가 적당합니다.
    const interval = setInterval(() => {
      // 브라우저 탭이 활성화되어 있을 때만 서버에서 데이터를 가져옴
      if (document.visibilityState === 'visible' && typeof loadData === 'function') {
        loadData();
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, [loadData]);

  // 2. 쓰기 최적화 (디바운스): 입력이 멈추고 1.5초 후에 한 번만 저장
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // 데이터가 있을 때만 저장 실행
    if (typeof saveData === 'function' && (nodes.length > 0 || edges.length > 0)) {
      const timeout = setTimeout(() => {
        console.log("자동 저장 실행 중...");
        saveData();
      }, 1500); // 1.5초 디바운스 (서버 부하 감소)
      
      return () => clearTimeout(timeout);
    }
  }, [nodes, edges, saveData]);

  return null; 
}