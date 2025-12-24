'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { MainNav } from '@/components/main-nav';
import { Logo } from '@/components/logo';
import { initialMockMembers, mockBooks } from '@/lib/data';
import type { Book, Rental, Member } from '@/lib/types';
import { FirebaseClientProvider, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'member';

interface AuthContextType {
  user: {
    uid: string;
    email: string | null;
    role: UserRole;
    name: string | null;
  } | null;
  isVerified: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface BooksContextType {
    books: Book[];
    addBook: (book: Omit<Book, 'id' | 'imageHint' | 'description' | 'status' | 'reservedBy' | 'dueDate'> & { description?: string, coverImage: string }) => void;
    updateBook: (book: Book) => void;
    deleteBook: (bookId: string) => void;
    rentals: Rental[];
    addRental: (rental: Omit<Rental, 'id'>) => void;
    endRental: (bookId: string) => void;
    members: Member[];
    seedInitialData: () => Promise<void>;
}

const BooksContext = createContext<BooksContextType | null>(null);

export function useBooks() {
    const context = useContext(BooksContext);
    if (!context) {
        throw new Error('useBooks must be used within a BooksProvider');
    }
    return context;
}

const BooksProvider = ({ children }: { children: ReactNode }) => {
    const { firestore, auth } = useFirebase();
    const { toast } = useToast();

    const booksRef = useMemoFirebase(() => firestore ? collection(firestore, 'books') : null, [firestore]);
    const { data: books, isLoading: isLoadingBooks } = useCollection<Book>(booksRef);

    const rentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'rentals') : null, [firestore]);
    const { data: rentals, isLoading: isLoadingRentals } = useCollection<Rental>(rentalsRef);

    const membersRef = useMemoFirebase(() => firestore ? collection(firestore, 'members') : null, [firestore]);
    const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersRef);
    
    const seedInitialData = async () => {
        if (!firestore) {
          toast({ variant: 'destructive', title: '오류', description: 'Firebase가 초기화되지 않았습니다.' });
          return;
        }
    
        toast({ title: '시작', description: '초기 도서 데이터 생성을 시작합니다...' });
    
        try {
          const booksSnapshot = await getDocs(booksRef);
          if (booksSnapshot.empty) {
            const batch = writeBatch(firestore);
            mockBooks.forEach((book) => {
              const newBookRef = doc(collection(firestore, 'books'));
              batch.set(newBookRef, book);
            });
            await batch.commit();
            toast({ title: '성공', description: '초기 도서 데이터가 성공적으로 생성되었습니다.' });
          } else {
             toast({ title: '알림', description: '이미 도서 데이터가 존재합니다. 초기화를 건너뜁니다.' });
          }
        } catch (error: any) {
          console.error('Error seeding data:', error);
          toast({ variant: 'destructive', title: '심각한 오류', description: `초기 데이터 생성 중 오류 발생: ${error.message}` });
        }
    };

    if (isLoadingBooks || isLoadingRentals || isLoadingMembers) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        );
    }

    const addBook = (book: Omit<Book, 'id' | 'imageHint' | 'description' | 'status' | 'reservedBy' | 'dueDate'> & { description?: string, coverImage: string }) => {
        if (!booksRef) return;
        const newBook: Omit<Book, 'id'> = {
            ...book,
            status: 'available',
            imageHint: 'book cover',
            description: book.description || `"${book.title}"은(는) ${book.author} 작가의 ${book.category} 장르 책입니다.`,
            reservedBy: null,
            dueDate: null,
        };
        addDocumentNonBlocking(booksRef, newBook);
    };

    const updateBook = (updatedBook: Book) => {
        if (!firestore) return;
        const bookRef = doc(firestore, 'books', updatedBook.id);
        const { id, ...bookData } = updatedBook;
        setDocumentNonBlocking(bookRef, bookData, { merge: true });
    };

    const deleteBook = (bookId: string) => {
        if (!firestore) return;
        const bookRef = doc(firestore, 'books', bookId);
        deleteDocumentNonBlocking(bookRef);
    };

    const addRental = (rental: Omit<Rental, 'id'>) => {
        if (!rentalsRef) return;
         addDocumentNonBlocking(rentalsRef, {
            ...rental,
            rentalDate: serverTimestamp()
        });
    };

    const endRental = async (bookId: string) => {
        if (!firestore) return;
        const q = query(collection(firestore, 'rentals'), where('bookId', '==', bookId), where('returnDate', '==', null));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(firestore);
        querySnapshot.forEach((document) => {
            const rentalRef = doc(firestore, 'rentals', document.id);
            batch.update(rentalRef, { returnDate: serverTimestamp() });
        });
        await batch.commit();
    };

    const rentalsWithDateFix = rentals?.map(r => ({
        ...r,
        rentalDate: r.rentalDate && (r.rentalDate as unknown as Timestamp).toDate().toISOString(),
        returnDate: r.returnDate && (r.returnDate as unknown as Timestamp).toDate().toISOString()
    })) || [];

    return (
        <BooksContext.Provider value={{ books: books || [], addBook, updateBook, deleteBook, rentals: rentalsWithDateFix, addRental, endRental, members: members || [], seedInitialData }}>
            {children}
        </BooksContext.Provider>
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const [authContext, setAuthContext] = useState<AuthContextType>({ user: null, isVerified: false });
  const [isDataSyncing, setIsDataSyncing] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    if (!firebaseUser) {
      router.replace('/login');
      setIsDataSyncing(false);
      return;
    }

    const syncMemberData = async () => {
      if (!firestore) return;
      setIsDataSyncing(true);

      const memberDocRef = doc(firestore, 'members', firebaseUser.uid);
      const memberDocSnap = await getDoc(memberDocRef);

      let finalMemberData: Member;

      if (!memberDocSnap.exists()) {
        const mockUser = initialMockMembers.find(m => m.email.toLowerCase() === firebaseUser.email?.toLowerCase());
        const newMemberData: Member = {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: mockUser?.name || '새 사용자',
          role: mockUser?.role || 'member',
        };
        try {
          await setDoc(memberDocRef, newMemberData);
          finalMemberData = newMemberData;
        } catch (error) {
          console.error("Error creating member document:", error);
          setIsDataSyncing(false);
          return;
        }
      } else {
        finalMemberData = memberDocSnap.data() as Member;
      }
      
      setAuthContext({
        user: {
          uid: firebaseUser.uid,
          email: finalMemberData.email,
          role: finalMemberData.role || 'member',
          name: finalMemberData.name,
        },
        isVerified: true,
      });
      setIsDataSyncing(false);
    };

    syncMemberData();

  }, [firebaseUser, isUserLoading, router, firestore]);

  if (isUserLoading || isDataSyncing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {isDataSyncing && !isUserLoading && <p className="ml-4">사용자 정보를 동기화하는 중입니다...</p>}
      </div>
    );
  }
  
  if (!authContext.isVerified && !isUserLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <p className="ml-4">인증 정보를 확인 중입니다...</p>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <BooksProvider>
        <SidebarProvider>
          <Sidebar>
            <SidebarHeader>
              <Logo />
            </SidebarHeader>
            <SidebarContent>
              <MainNav />
            </SidebarContent>
            <SidebarFooter>
              {/* You can add footer content here */}
            </SidebarFooter>
          </Sidebar>
          <SidebarInset>
            <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
              <div className="flex w-full items-center justify-end">
                <UserNav />
              </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </BooksProvider>
    </AuthContext.Provider>
  );
}
