import { create } from 'zustand';
import axios from 'axios';

// 기존 인터페이스에 맞춰서 수정
export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  // 서버에서 데이터를 읽어와서 스토어 업데이트
  loadFromServer: async () => {
    try {
      const res = await axios.get('/api/data');
      const serverNodes = res.data.nodes || [];
      const serverEdges = res.data.edges || [];
  
      // 현재 스토어의 데이터와 서버 데이터가 다를 때만 업데이트
      const { nodes, edges } = get();
      if (JSON.stringify(nodes) !== JSON.stringify(serverNodes)) {
        set({ nodes: serverNodes, edges: serverEdges });
      }
    } catch (e) {
      console.error("Load failed", e);
    }
  }

  // 스토어의 현재 상태를 서버 파일에 저장
  saveToServer: async () => {
    const { nodes, edges } = get();
    try {
      await axios.post('/api/data', { nodes, edges });
    } catch (e) {
      console.error("데이터 저장 실패", e);
    }
  },
}));