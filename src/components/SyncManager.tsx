'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';

export default function SyncManager() {
  // 스토어의 새로운 함수 이름(loadData, saveData)으로 매핑
  const loadData = useStore((state) => state.loadData);
  const saveData = useStore((state) => state.saveData);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);

  // 무한 루프 방지를 위한 최초 로드 여부 체크
  const isInitialMount = useRef(true);

  // 1. 서버에서 데이터 가져오기 (이름 변경: loadFromServer -> loadData)
  useEffect(() => {
    if (typeof loadData === 'function') {
      loadData();
    }
    
    // 30초마다 갱신 (3초는 서버 부하가 클 수 있어 30초로 권장하지만, 필요시 유지 가능)
    const interval = setInterval(() => {
      if (typeof loadData === 'function') {
        loadData();
      }
    }, 30000); 

    return () => clearInterval(interval);
  }, [loadData]);

  // 2. 서버에 데이터 저장 (이름 변경: saveToServer -> saveData)
  useEffect(() => {
    // 최초 앱 로드 시점에 빈 상태를 서버에 덮어쓰는 것을 방지
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (typeof saveData === 'function') {
      const timeout = setTimeout(() => {
        saveData();
      }, 1000); // 디바운스 시간을 1초로 늘려 안정성 확보
      return () => clearTimeout(timeout);
    }
  }, [nodes, edges, saveData]);

  return null;
}