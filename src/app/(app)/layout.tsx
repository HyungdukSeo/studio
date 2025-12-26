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
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, Timestamp, getDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { createUserWithEmailAndPassword } from 'firebase/auth';

type UserRole = 'admin' | 'member';

interface AppContextType {
  user: {
    uid: string;
    email: string | null;
    role: UserRole;
    name: string | null;
  } | null;
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

const AppContext = createContext<AppContextType | null>(null);

export function useAuth() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAuth must be used within an AppProvider');
    return { user: context.user };
}

export function useBooks() {
    const context = useContext(AppContext);
    if (!context) throw new Error('useBooks must be used within an AppProvider');
    return context;
}

const AppProvider = ({ children, user }: { children: ReactNode, user: AppContextType['user'] }) => {
    const { firestore, auth } = useFirebase();
    const { toast } = useToast();

    const booksRef = useMemoFirebase(() => firestore ? collection(firestore, 'books') : null, [firestore]);
    const { data: books, isLoading: isLoadingBooks } = useCollection<Book>(booksRef);

    const rentalsRef = useMemoFirebase(() => firestore ? collection(firestore, 'rentals') : null, [firestore]);
    const { data: rentals, isLoading: isLoadingRentals } = useCollection<Rental>(rentalsRef);

    const membersRef = useMemoFirebase(() => firestore ? collection(firestore, 'members') : null, [firestore]);
    const { data: members, isLoading: isLoadingMembers } = useCollection<Member>(membersRef);

    const addBook = useCallback((book: Omit<Book, 'id' | 'imageHint' | 'description' | 'status' | 'reservedBy' | 'dueDate'> & { description?: string, coverImage: string }) => {
        if (!booksRef) return;
        const newBook: Omit<Book, 'id'> = {
            ...book,
            status: 'available',
            imageHint: 'book cover',
            description: book.description || `"${book.title}"은(는) ${book.author} 작가의 ${book.category} 장르 책입니다.`,
            reservedBy: null,
            dueDate: null,
        };
        addDoc(booksRef, newBook);
    }, [booksRef]);

    const updateBook = useCallback((updatedBook: Book) => {
        if (!firestore) return;
        const bookRef = doc(firestore, 'books', updatedBook.id);
        const { id, ...bookData } = updatedBook;
        setDoc(bookRef, bookData, { merge: true });
    }, [firestore]);

    const deleteBook = useCallback((bookId: string) => {
        if (!firestore) return;
        const bookRef = doc(firestore, 'books', bookId);
        deleteDoc(bookRef);
    }, [firestore]);

    const addRental = useCallback((rental: Omit<Rental, 'id'>) => {
        if (!rentalsRef) return;
        addDoc(rentalsRef, {
            ...rental,
            rentalDate: serverTimestamp()
        });
    }, [rentalsRef]);

    const endRental = useCallback(async (bookId: string) => {
        if (!firestore) return;
        const q = query(collection(firestore, 'rentals'), where('bookId', '==', bookId), where('returnDate', '==', null));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(firestore);
        querySnapshot.forEach((document) => {
            const rentalRef = doc(firestore, 'rentals', document.id);
            batch.update(rentalRef, { returnDate: serverTimestamp() });
        });
        await batch.commit();
    }, [firestore]);
    
    const seedInitialData = async () => {
        if (!firestore || !auth) {
            toast({ variant: 'destructive', title: '오류', description: 'Firebase가 준비되지 않았습니다.' });
            return;
        }

        const lockRef = doc(firestore, 'internal/locks/seeding');
        try {
            const lockSnap = await getDoc(lockRef);
            if (lockSnap.exists()) {
                toast({ title: '안내', description: '초기 데이터가 이미 설정되어 있습니다.' });
                return;
            }

            toast({ title: '초기 데이터 설정 시작', description: '도서 및 회원 정보를 데이터베이스에 생성합니다. 잠시 기다려주세요...' });

            const batch = writeBatch(firestore);

            // Seed Books
            const booksCollectionRef = collection(firestore, 'books');
            mockBooks.forEach(book => {
                const bookRef = doc(booksCollectionRef);
                batch.set(bookRef, book);
            });

            // Seed Members
            for (const member of initialMockMembers) {
                try {
                    // This can only be run once per user email.
                    const userCredential = await createUserWithEmailAndPassword(auth, member.email, '123456');
                    const newUser = userCredential.user;

                    const memberRef = doc(firestore, 'members', newUser.uid);
                    batch.set(memberRef, { ...member, id: newUser.uid });

                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use') {
                        console.log(`Auth user ${member.email} already exists. Skipping auth creation, but will check/add Firestore doc.`);
                        const q = query(collection(firestore, "members"), where("email", "==", member.email));
                        const querySnapshot = await getDocs(q);
                        if(querySnapshot.empty) {
                           // This state is tricky. Auth user exists but no member doc.
                           // For this seeding purpose, we can't get UID without login.
                           // The login flow should handle creating the member doc if it's missing.
                           console.warn(`Auth user ${member.email} exists, but no member doc. It should be created on their first login.`);
                        }
                    } else {
                        console.error(`Failed to create member ${member.email}:`, error);
                        toast({ variant: 'destructive', title: '오류', description: `${member.email} 계정 생성에 실패했습니다: ${error.message}` });
                    }
                }
            }
            
            // Set the lock
            batch.set(lockRef, { completedAt: serverTimestamp() });
            
            await batch.commit();
            toast({ title: '초기 데이터 설정 완료', description: '모든 도서와 회원 정보가 성공적으로 생성되었습니다.' });

        } catch (error: any) {
            console.error("Error seeding initial data:", error);
            toast({ variant: 'destructive', title: '데이터 생성 오류', description: `초기 데이터 설정 중 문제가 발생했습니다: ${error.message}` });
        }
    };


    if (isLoadingBooks || isLoadingRentals || isLoadingMembers) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        );
    }

    const rentalsWithDateFix = rentals?.map(r => ({
        ...r,
        rentalDate: r.rentalDate && (r.rentalDate as unknown as Timestamp).toDate().toISOString(),
        returnDate: r.returnDate && (r.returnDate as unknown as Timestamp).toDate().toISOString()
    })) || [];

    return (
        <AppContext.Provider value={{ user, books: books || [], addBook, updateBook, deleteBook, rentals: rentalsWithDateFix, addRental, endRental, members: members || [], seedInitialData }}>
            {children}
        </AppContext.Provider>
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user: firebaseUser, isUserLoading, firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [authInfo, setAuthInfo] = useState<{ user: AppContextType['user'], isVerified: boolean } | null>(null);

  useEffect(() => {
    if (isUserLoading) return;

    if (!firebaseUser) {
      router.replace('/login');
      return;
    }

    const syncAndVerifyUser = async () => {
      if (!firestore || !firebaseUser.email) return;

      try {
          const q = query(collection(firestore, "members"), where("email", "==", firebaseUser.email));
          const querySnapshot = await getDocs(q);

          let finalMemberData: Member;

          if (querySnapshot.empty) {
              const mockUser = initialMockMembers.find(m => m.email.toLowerCase() === firebaseUser.email!.toLowerCase());
              
              const newMemberData: Member = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email!,
                  name: mockUser?.name || firebaseUser.email!.split('@')[0],
                  role: mockUser?.role || 'member',
              };

              await setDoc(doc(firestore, 'members', firebaseUser.uid), newMemberData);
              finalMemberData = newMemberData;
              toast({ title: '환영합니다!', description: `프로필 정보가 생성되었습니다.` });
          } else {
              finalMemberData = querySnapshot.docs[0].data() as Member;
          }

          setAuthInfo({
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
          setAuthInfo({ user: null, isVerified: false });
      }
    };
    
    syncAndVerifyUser();

  }, [firebaseUser, isUserLoading, router, firestore, toast]);

  if (isUserLoading || !authInfo) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4">사용자 정보를 확인하는 중입니다...</p>
      </div>
    );
  }
  
  if (!authInfo.isVerified) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-destructive" />
        <p className="ml-4">사용자 정보를 확인하는데 실패했습니다. 다시 로그인해주세요.</p>
      </div>
    );
  }

  return (
    <AppProvider user={authInfo.user}>
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
    </AppProvider>
  );
}
