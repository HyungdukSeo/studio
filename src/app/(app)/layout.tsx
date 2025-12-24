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
import { initialMockMembers } from '@/lib/data';
import type { Book, Rental, Member } from '@/lib/types';
import { FirebaseClientProvider, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, Timestamp, getDoc, setDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
        if (!firestore || !auth) {
          toast({ variant: 'destructive', title: '오류', description: 'Firebase가 초기화되지 않았습니다.' });
          return;
        }
    
        toast({ title: '시작', description: '초기 데이터 생성을 시작합니다...' });
    
        try {
          // 1. Check if members collection is empty
          const membersSnapshot = await getDocs(membersRef);
          if (!membersSnapshot.empty) {
            toast({ title: '알림', description: '이미 회원 데이터가 존재합니다. 초기화를 건너뜁니다.' });
            return;
          }
    
          // 2. Create users in Auth and Firestore
          for (const member of initialMockMembers) {
            try {
              // Create user in Firebase Authentication
              const userCredential = await createUserWithEmailAndPassword(auth, member.email, '123456');
              const user = userCredential.user;
    
              // Create user document in Firestore
              const memberData: Member = {
                id: user.uid,
                email: member.email,
                name: member.name,
                role: member.role || 'member',
              };
              await setDoc(doc(firestore, 'members', user.uid), memberData);
               toast({ title: '회원 생성', description: `${member.name} (${member.email}) 님을 등록했습니다.` });
            } catch (error: any) {
              if (error.code === 'auth/email-already-in-use') {
                 toast({ variant: 'destructive', title: '경고', description: `${member.email}는 이미 인증 시스템에 존재합니다. Firestore 문서만 확인합니다.` });
                 // If auth user exists, ensure firestore doc exists
                 const q = query(collection(firestore, "members"), where("email", "==", member.email));
                 const querySnapshot = await getDocs(q);
                 if (querySnapshot.empty) {
                    // This case is unlikely if seeding is done correctly, but as a fallback
                    console.warn(`Auth user for ${member.email} exists, but no firestore doc. A new doc could be created here if needed.`);
                 }
              } else {
                console.error(`Error creating user ${member.email}:`, error);
                toast({ variant: 'destructive', title: '오류', description: `${member.email} 생성 중 오류: ${error.message}` });
              }
            }
          }
          
          toast({ title: '완료', description: '모든 초기 회원이 성공적으로 생성되었습니다.' });
    
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

  const memberDocRef = useMemoFirebase(() => {
      if (!firebaseUser || !firestore) return null;
      return doc(firestore, 'members', firebaseUser.uid);
  }, [firebaseUser, firestore]);

  const { data: memberData, isLoading: isMemberDataLoading } = useCollection<Member>(
      useMemoFirebase(() => {
          if (!firebaseUser) return null;
          return query(collection(firestore, 'members'), where('email', '==', firebaseUser.email));
      }, [firestore, firebaseUser])
  );

  useEffect(() => {
    if (isUserLoading) return;

    if (!firebaseUser) {
      router.replace('/login');
      setIsDataSyncing(false);
      return;
    }

    const syncMemberData = async () => {
      if (firebaseUser && firestore && !isMemberDataLoading) {
        if (!memberData || memberData.length === 0) {
          const mockUser = initialMockMembers.find(m => m.email.toLowerCase() === firebaseUser.email?.toLowerCase());

          if (mockUser) {
            const newMemberData: Member = {
              id: firebaseUser.uid,
              email: mockUser.email,
              name: mockUser.name,
              role: mockUser.role || 'member',
            };
            try {
              await setDoc(doc(firestore, 'members', firebaseUser.uid), newMemberData);
            } catch (error) {
              console.error("Error creating member document:", error);
            }
          }
        }
        
        if (memberData && memberData.length > 0) {
            const currentMember = memberData[0];
            setAuthContext({
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                role: currentMember.role || 'member',
                name: currentMember.name,
              },
              isVerified: true,
            });
        } else if (!memberData) {
            // This handles the case where the memberData isn't loaded yet, but also the case for new users
            // Let's assume if there's no data, we can create a temporary context and it will get updated
             const mockUser = initialMockMembers.find(m => m.email.toLowerCase() === firebaseUser.email?.toLowerCase());
             if (mockUser) {
                 setAuthContext({
                     user: {
                         uid: firebaseUser.uid,
                         email: firebaseUser.email,
                         role: mockUser.role || 'member',
                         name: mockUser.name
                     },
                     isVerified: true
                 });
             }
        }

        setIsDataSyncing(false);
      }
    };

    syncMemberData();

  }, [firebaseUser, isUserLoading, router, firestore, memberData, isMemberDataLoading]);

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
