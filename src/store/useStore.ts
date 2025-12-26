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
      set({ 
        nodes: res.data.nodes || [], 
        edges: res.data.edges || [] 
      });
    } catch (e) {
      console.error("데이터 로드 실패", e);
    }
  },

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