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
import { mockBooks as initialMockBooks, mockMembers as initialMockMembers } from '@/lib/data';
import type { Book, Rental, Member } from '@/lib/types';
import { FirebaseClientProvider, useFirebase, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, writeBatch, serverTimestamp, query, where, getDocs, Timestamp, getDoc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword } from 'firebase/auth';


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

    useEffect(() => {
        const seedData = async () => {
            if (!firestore) return;

            const booksSnapshot = await getDocs(query(collection(firestore, 'books')));
            if (booksSnapshot.empty) {
                const batch = writeBatch(firestore);
                initialMockBooks.forEach(book => {
                    const bookDocRef = doc(collection(firestore, 'books'));
                    batch.set(bookDocRef, {...book, id: bookDocRef.id});
                });
                await batch.commit();
            }
        };

        seedData();
    }, [firestore]);


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
        addDocumentNonBlocking(booksRef, newBook);
    }, [booksRef]);

    const updateBook = useCallback((updatedBook: Book) => {
        if (!firestore) return;
        const bookRef = doc(firestore, 'books', updatedBook.id);
        const { id, ...bookData } = updatedBook;
        setDocumentNonBlocking(bookRef, bookData, { merge: true });
    }, [firestore]);

    const deleteBook = useCallback((bookId: string) => {
        if (!firestore) return;
        const bookRef = doc(firestore, 'books', bookId);
        deleteDocumentNonBlocking(bookRef);
    }, [firestore]);

    const addRental = useCallback((rental: Omit<Rental, 'id'>) => {
        if (!rentalsRef) return;
         addDocumentNonBlocking(rentalsRef, {
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

    const rentalsWithDateFix = useMemo(() => {
        return rentals?.map(r => ({
            ...r,
            rentalDate: r.rentalDate && (r.rentalDate as unknown as Timestamp).toDate().toISOString(),
            returnDate: r.returnDate && (r.returnDate as unknown as Timestamp).toDate().toISOString()
        })) || [];
    }, [rentals]);
    
    if (isLoadingBooks || isLoadingRentals || isLoadingMembers) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        );
    }

    return (
        <BooksContext.Provider value={{ books: books || [], addBook, updateBook, deleteBook, rentals: rentalsWithDateFix, addRental, endRental, members: members || [] }}>
            {children}
        </BooksContext.Provider>
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, auth, firestore } = useFirebase();
  const router = useRouter();
  const [authContext, setAuthContext] = useState<AuthContextType>({ user: null, isVerified: false });
  const [isSeeding, setIsSeeding] = useState(true);

  const memberDocRef = useMemoFirebase(() => {
      if (!user || !firestore) return null;
      return doc(firestore, 'members', user.uid);
  }, [user, firestore]);
  const { data: memberData } = useDoc<Member>(memberDocRef);

  useEffect(() => {
    const seedInitialUsers = async () => {
        if (!auth || !firestore) return;
        
        const membersSnapshot = await getDocs(query(collection(firestore, 'members')));
        if (!membersSnapshot.empty) {
            setIsSeeding(false);
            return;
        }

        console.log("Seeding initial users...");

        const allUsersToSeed = [
            ...initialMockMembers,
            { name: '관리자', email: 'root@ipageon.com', role: 'admin' as const }
        ];

        const DEFAULT_PASSWORD = '1234';

        try {
            const batch = writeBatch(firestore);
            for (const member of allUsersToSeed) {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, member.email, DEFAULT_PASSWORD);
                    const newUser = userCredential.user;
                    
                    const memberDocRef = doc(firestore, 'members', newUser.uid);
                    const newMemberData: Member = {
                        id: newUser.uid,
                        email: member.email,
                        name: member.name,
                        role: member.role || 'member',
                    };
                    batch.set(memberDocRef, newMemberData);
                } catch (error: any) {
                    if (error.code === 'auth/email-already-in-use') {
                        console.log(`User ${member.email} already exists in Auth. Skipping Auth creation.`);
                        // If user exists in Auth but maybe not in Firestore, we could handle that here.
                        // For this seeding script, we'll assume if it fails, it's okay to maybe re-run or handle manually.
                    } else {
                        console.error(`Error creating user ${member.email}:`, error);
                    }
                }
            }
            await batch.commit();
            console.log("Initial user seeding complete.");
        } catch (error) {
            console.error("Error committing user seed batch:", error);
        } finally {
            setIsSeeding(false);
        }
    };

    seedInitialUsers();
  }, [auth, firestore]);


  useEffect(() => {
    if (!isUserLoading && !isSeeding) {
      if (!user) {
        router.replace('/login');
      } else if (memberData) {
        setAuthContext({
          user: {
            uid: user.uid,
            email: user.email || '',
            role: memberData.role || 'member',
            name: memberData.name,
          },
          isVerified: true,
        });
      } else if(user && !memberData) {
          // This can happen if the user exists in Auth but not in Firestore yet.
          // The check for memberData will re-run when the useDoc hook updates.
          console.log("Waiting for member data from Firestore...");
      }
    }
  }, [user, isUserLoading, isSeeding, router, memberData]);

  if (isUserLoading || !authContext.isVerified || isSeeding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {isSeeding && <p className="ml-4">초기 사용자 정보를 설정하는 중입니다...</p>}
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
