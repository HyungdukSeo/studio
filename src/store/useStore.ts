import { create } from 'zustand';
import axios from 'axios';
import { Book, Member, Rental } from '@/types';

interface LibraryState {
  books: Book[];
  members: Member[];
  rentals: Rental[];
  nodes: any[];
  edges: any[];

  // 데이터 동기화
  loadData: () => Promise<void>;
  saveData: () => Promise<void>;

  // 도서 관리
  updateBookStatus: (bookId: string, status: 'available' | 'borrowed' | 'reserved') => void;
  updateBookInfo: (bookId: string, updates: Partial<Book>) => void;

  // 멤버 및 보안
  updateMemberPassword: (memberId: string, newPassword: string) => void;
  addMember: (member: Member) => void;

  // 대여 및 예약 로직
  processRental: (bookId: string, memberId: string, memberName: string, bookTitle: string) => void;
  processReturn: (rentalId: string, bookId: string) => void;
  extendRental: (rentalId: string, days: number) => void;
}

export const useStore = create<LibraryState>((set, get) => ({
  books: [],
  members: [],
  rentals: [],
  nodes: [],
  edges: [],

  // 1. 서버(data.json)에서 데이터 가져오기
  loadData: async () => {
    try {
      const res = await axios.get('/api/data');
      set({
        books: res.data.books || [],
        members: res.data.members || [],
        rentals: res.data.rentals || [],
        nodes: res.data.nodes || [],
        edges: res.data.edges || []
      });
    } catch (e) {
      console.error("데이터 로드 실패:", e);
    }
  },

  // 2. 서버(data.json)에 현재 상태 저장하기
  saveData: async () => {
    const state = get();
    try {
      await axios.post('/api/data', {
        books: state.books,
        members: state.members,
        rentals: state.rentals,
        nodes: state.nodes,
        edges: state.edges
      });
    } catch (e) {
      console.error("데이터 저장 실패:", e);
    }
  },

  // 3. 도서 상태 및 정보 변경
  updateBookStatus: (bookId, status) => {
    set((state) => ({
      books: state.books.map((b) => (b.id === bookId ? { ...b, status } : b)),
    }));
    get().saveData();
  },

  updateBookInfo: (bookId, updates) => {
    set((state) => ({
      books: state.books.map((b) => (b.id === bookId ? { ...b, ...updates } : b)),
    }));
    get().saveData();
  },

  // 4. 멤버 정보 및 비밀번호 변경
  updateMemberPassword: (memberId, newPassword) => {
    set((state) => ({
      members: state.members.map((m) =>
        m.id === memberId ? { ...m, password: newPassword } : m
      ),
    }));
    get().saveData();
  },

  addMember: (member) => {
    set((state) => ({ members: [...state.members, member] }));
    get().saveData();
  },

  // 5. 대여 처리 (대여 기록 생성 + 도서 상태 변경)
  processRental: (bookId, memberId, memberName, bookTitle) => {
    const newRental: Rental = {
      id: `rental-${Date.now()}`,
      bookId,
      memberId,
      memberName,
      bookTitle,
      rentalDate: new Date(),
      returnDate: null, // 아직 반납 안됨
    };

    set((state) => ({
      rentals: [newRental, ...state.rentals],
      books: state.books.map((b) =>
        b.id === bookId ? { ...b, status: 'borrowed' } : b
      ),
    }));
    get().saveData();
  },

  // 6. 반납 처리 (반납일 기록 + 도서 상태 변경)
  processReturn: (rentalId, bookId) => {
    set((state) => ({
      rentals: state.rentals.map((r) =>
        r.id === rentalId ? { ...r, returnDate: new Date() } : r
      ),
      books: state.books.map((b) =>
        b.id === bookId ? { ...b, status: 'available' } : b
      ),
    }));
    get().saveData();
  },

  // 7. 대여일 연장 (기존 대여일 정보 수정)
  extendRental: (rentalId, days) => {
    set((state) => ({
      rentals: state.rentals.map((r) => {
        if (r.id === rentalId && r.rentalDate) {
          const newDate = new Date(r.rentalDate);
          newDate.setDate(newDate.getDate() + days);
          return { ...r, rentalDate: newDate };
        }
        return r;
      }),
    }));
    get().saveData();
  }
}));