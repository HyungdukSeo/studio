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
import { mockBooks, initialMockMembers } from '@/lib/data';
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
  seedInitialData: () => Promise<void>;
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
    const { firestore } = useFirebase();

    const booksRef = useMemoFirebase(() => firestore ? collection(firestore, 'books') : null, [firestore]);
    const { data: books, isLoading: isLoadingBooks } = useCollection<Book>(booksRef);

    const rentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'rentals') : null, [firestore]);
    const { data: rentals, isLoading: isLoadingRentals } = useCollection<Rental>(rentalsRef);

    const membersRef = useMemoFirebase(() => firestore ? collection(firestore, 'members') : null, [firestore]);
    const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersRef);

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
        <BooksContext.Provider value={{ books: books || [], addBook, updateBook, deleteBook, rentals: rentalsWithDateFix, addRental, endRental, members: members || [] }}>
            {children}
        </BooksContext.Provider>
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading, firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [authContext, setAuthContext] = useState<AuthContextType | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  const seedInitialData = useCallback(async () => {
    if (!firestore) return;
    toast({ title: '초기 데이터 생성 시작', description: '도서 및 회원 정보를 설정합니다.' });
    try {
        const booksQuery = query(collection(firestore, 'books'));
        const booksSnapshot = await getDocs(booksQuery);

        if (booksSnapshot.empty) {
            const batch = writeBatch(firestore);
            mockBooks.forEach(book => {
                const bookRef = doc(collection(firestore, 'books'));
                batch.set(bookRef, book);
            });
            await batch.commit();
            toast({ title: '도서 정보 생성 완료', description: `${mockBooks.length}권의 도서 정보가 추가되었습니다.` });
        } else {
             toast({ title: '알림', description: '도서 정보가 이미 존재합니다.' });
        }

        const membersQuery = query(collection(firestore, 'members'));
        const membersSnapshot = await getDocs(membersQuery);
        if (membersSnapshot.empty) {
            const batch = writeBatch(firestore);
            initialMockMembers.forEach(member => {
                // IMPORTANT: In a real app, you'd create users in Firebase Auth first
                // and use their UID as the document ID. Here we use email for simplicity in seeding.
                // This will be handled by the login/user creation flow.
                 const memberDocRef = doc(firestore, 'members', member.email);
                 batch.set(memberDocRef, member);
            });
            await batch.commit();
             toast({ title: '회원 정보 생성 완료', description: `${initialMockMembers.length}명의 회원 정보가 추가되었습니다.` });
        } else {
            toast({ title: '알림', description: '회원 정보가 이미 존재합니다.' });
        }

    } catch (error) {
        console.error("Error seeding data:", error);
        toast({ variant: 'destructive', title: '데이터 생성 오류', description: '초기 데이터 생성 중 문제가 발생했습니다.' });
    }
  }, [firestore, toast]);

  useEffect(() => {
    if (isUserLoading) return;

    if (!firebaseUser) {
      router.replace('/login');
      setIsSyncing(false);
      return;
    }

    const syncMemberData = async () => {
      if (!firestore) return;
      setIsSyncing(true);

      const memberDocRef = doc(firestore, 'members', firebaseUser.uid);
      
      try {
        const memberDocSnap = await getDoc(memberDocRef);
        let finalMemberData: Member;

        if (!memberDocSnap.exists()) {
          // Find user from mock data by email
          const mockUser = initialMockMembers.find(m => m.email.toLowerCase() === firebaseUser.email?.toLowerCase());
          
          const newMemberData: Member = {
            id: firebaseUser.uid,
            email: firebaseUser.email!,
            name: mockUser?.name || firebaseUser.email!.split('@')[0],
            role: mockUser?.role || 'member',
          };

          await setDoc(memberDocRef, newMemberData);
          finalMemberData = newMemberData;
          toast({ title: '환영합니다!', description: `프로필 정보가 생성되었습니다.` });

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
          seedInitialData,
        });

      } catch (error) {
          console.error("Error syncing member data:", error);
          if (error instanceof Error && error.message.includes('permission-denied')) {
               toast({ variant: 'destructive', title: '권한 오류', description: '데이터를 읽을 권한이 없습니다. 보안 규칙을 확인하세요.' });
          } else {
               toast({ variant: 'destructive', title: '오류', description: '사용자 정보 동기화에 실패했습니다.' });
          }
      } finally {
        setIsSyncing(false);
      }
    };

    syncMemberData();

  }, [firebaseUser, isUserLoading, router, firestore, toast, seedInitialData]);

  if (isUserLoading || isSyncing) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {isSyncing && !isUserLoading && <p className="ml-4">사용자 정보를 동기화하는 중입니다...</p>}
      </div>
    );
  }
  
  if (!authContext?.isVerified && !isUserLoading) {
    return (
        <div className="flex h-screen items-center justify-center">
             <Loader2 className="h-10 w-10 animate-spin text-primary" />
             <p className="ml-4">인증 정보를 확인 중입니다...</p>
        </div>
    );
  }
  
  if (!authContext) {
      return null;
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
