'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext, useCallback, ReactNode, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { UserNav } from '@/components/user-nav';
import { MainNav } from '@/components/main-nav';
import { Logo } from '@/components/logo';
import { mockBooks, initialMockMembers } from '@/lib/data';
import type { Book, Rental, Member } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'admin' | 'member';

interface AppContextType {
  user: {
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

const AppProvider = ({ children, user }: { children: ReactNode; user: AppContextType['user'] }) => {
    const [books, setBooks] = useState<Book[]>(() =>
        mockBooks.map((book, index) => ({ ...book, id: `book-${index + 1}`}))
    );
    const [members, setMembers] = useState<Member[]>(() => 
        initialMockMembers.map((member, index) => ({ ...member, id: `member-${index + 1}` }))
    );
    const [rentals, setRentals] = useState<Rental[]>([]);

    const addBook = useCallback((book: Omit<Book, 'id' | 'imageHint' | 'description' | 'status' | 'reservedBy' | 'dueDate'> & { description?: string, coverImage: string }) => {
        setBooks(prev => {
            const newBook: Book = {
                ...book,
                id: `book-${prev.length + 1}`,
                status: 'available',
                imageHint: 'book cover',
                description: book.description || `"${book.title}"은(는) ${book.author} 작가의 ${book.category} 장르 책입니다.`,
                reservedBy: null,
                dueDate: null,
            };
            return [...prev, newBook];
        });
    }, []);

    const updateBook = useCallback((updatedBook: Book) => {
        setBooks(prev => prev.map(book => book.id === updatedBook.id ? updatedBook : book));
    }, []);

    const deleteBook = useCallback((bookId: string) => {
        setBooks(prev => prev.filter(book => book.id !== bookId));
    }, []);

    const addRental = useCallback((rental: Omit<Rental, 'id'>) => {
        setRentals(prev => {
            const newRental: Rental = {
                ...rental,
                id: `rental-${prev.length + 1}`,
            };
            return [...prev, newRental];
        });
    }, []);
    
    const endRental = useCallback((bookId: string) => {
        setRentals(prev => 
            prev.map(rental => 
                rental.bookId === bookId && !rental.returnDate
                ? { ...rental, returnDate: new Date().toISOString() }
                : rental
            )
        );
    }, []);

    return (
        <AppContext.Provider value={{ user, books, addBook, updateBook, deleteBook, rentals, addRental, endRental, members }}>
            {children}
        </AppContext.Provider>
    );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<AppContextType['user'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('bookbridge-user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            router.replace('/login');
        }
        setIsLoading(false);
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('bookbridge-user');
        setUser(null);
        router.replace('/login');
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <AppProvider user={user}>
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
                            <UserNav onLogout={handleLogout} />
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
