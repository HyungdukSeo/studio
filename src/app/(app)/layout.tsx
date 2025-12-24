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
  const { user: firebaseUser, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [authContext, setAuthContext] = useState<AuthContextType | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;

    if (!firebaseUser) {
      router.replace('/login');
      setIsSyncing(false);
      return;
    }

    const syncAndVerifyUser = async () => {
      if (!firestore || !firebaseUser.email) {
          setIsSyncing(false);
          return;
      }
      setIsSyncing(true);

      try {
          const memberDocRef = doc(firestore, 'members', firebaseUser.uid);
          let memberDocSnap = await getDoc(memberDocRef);

          let finalMemberData: Member;

          if (!memberDocSnap.exists()) {
              const mockUser = initialMockMembers.find(m => m.email.toLowerCase() === firebaseUser.email!.toLowerCase());
              
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
          });

      } catch (error) {
          console.error("Error syncing user data:", error);
          toast({ variant: 'destructive', title: '오류', description: '사용자 정보 동기화에 실패했습니다.' });
      } finally {
          setIsSyncing(false);
      }
    };
    
    syncAndVerifyUser();

  }, [firebaseUser, isUserLoading, router, firestore, toast]);

  // One-time data seeding logic for admin
  useEffect(() => {
    if (authContext?.user?.role !== 'admin' || !firestore) {
      return;
    }

    const seedInitialData = async () => {
        const lockRef = doc(firestore, 'internal/locks/seeding');
        try {
            const lockSnap = await getDoc(lockRef);
            if (lockSnap.exists()) {
                console.log("초기 데이터가 이미 설정되었습니다. 건너뜁니다.");
                return;
            }

            toast({ title: '초기 데이터 설정 시작', description: '도서 및 회원 정보를 데이터베이스에 생성합니다.' });

            const batch = writeBatch(firestore);

            // Seed Books
            const booksCollectionRef = collection(firestore, 'books');
            const booksSnapshot = await getDocs(booksCollectionRef);
            if (booksSnapshot.empty) {
                mockBooks.forEach(book => {
                    const bookRef = doc(collection(firestore, 'books'));
                    batch.set(bookRef, book);
                });
            }

            // Seed Members (if you still want to pre-populate them in DB for reference)
            const membersCollectionRef = collection(firestore, 'members');
            const membersSnapshot = await getDocs(membersCollectionRef);
            if (membersSnapshot.empty) {
                // Note: This does not create Auth users, only Firestore member records.
                // Auth users are created on first login.
                 initialMockMembers.forEach(member => {
                    // We can't know the UID in advance, so we use email as ID here,
                    // but the login flow will create the correct doc with UID as ID.
                    // This is for reference/listing purposes.
                    const memberRef = doc(firestore, 'members', member.email);
                    batch.set(memberRef, member);
                 });
            }

            // Set the lock
            batch.set(lockRef, { completedAt: serverTimestamp() });
            
            await batch.commit();
            toast({ title: '초기 데이터 설정 완료' });

        } catch (error) {
            console.error("Error seeding initial data:", error);
            toast({ variant: 'destructive', title: '데이터 생성 오류', description: '초기 데이터 설정 중 문제가 발생했습니다.' });
        }
    };

    seedInitialData();

  }, [authContext, firestore, toast]);


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
