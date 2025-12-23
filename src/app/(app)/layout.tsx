'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, createContext, useContext, useCallback, ReactNode } from 'react';
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
import { mockBooks as initialMockBooks } from '@/lib/data';
import type { Book } from '@/lib/types';


type UserRole = 'admin' | 'member';

interface AuthContextType {
  user: {
    email: string | null;
    role: UserRole;
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
    addBook: (book: Omit<Book, 'id' | 'status' | 'imageHint'>) => void;
    updateBook: (book: Book) => void;
    deleteBook: (bookId: string) => void;
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
    const [books, setBooks] = useState<Book[]>([]);
    const [isBooksInitialized, setIsBooksInitialized] = useState(false);

    useEffect(() => {
        try {
            const storedBooks = localStorage.getItem('books_data');
            if (storedBooks) {
                setBooks(JSON.parse(storedBooks));
            } else {
                setBooks(initialMockBooks);
                localStorage.setItem('books_data', JSON.stringify(initialMockBooks));
            }
        } catch (error) {
            console.error("Failed to access localStorage or parse books data:", error);
            setBooks(initialMockBooks);
        }
        setIsBooksInitialized(true);
    }, []);

    const updateLocalStorage = (newBooks: Book[]) => {
        try {
            localStorage.setItem('books_data', JSON.stringify(newBooks));
        } catch (error) {
            console.error("Failed to save books data to localStorage:", error);
        }
    };
    
    const addBook = useCallback((book: Omit<Book, 'id' | 'status' | 'imageHint'>) => {
        setBooks(prev => {
            const newBook: Book = {
                ...book,
                id: `book-${Date.now()}`,
                status: 'available',
                imageHint: 'book cover',
            };
            const newBooks = [newBook, ...prev];
            updateLocalStorage(newBooks);
            return newBooks;
        });
    }, []);

    const updateBook = useCallback((updatedBook: Book) => {
        setBooks(prev => {
            const newBooks = prev.map(b => b.id === updatedBook.id ? updatedBook : b);
            updateLocalStorage(newBooks);
            return newBooks;
        });
    }, []);

    const deleteBook = useCallback((bookId: string) => {
        setBooks(prev => {
            const newBooks = prev.filter(b => b.id !== bookId);
            updateLocalStorage(newBooks);
            return newBooks;
        });
    }, []);
    
    if (!isBooksInitialized) {
        return null; // Or a loading indicator
    }

    return (
        <BooksContext.Provider value={{ books, addBook, updateBook, deleteBook }}>
            {children}
        </BooksContext.Provider>
    );
};


export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [auth, setAuth] = useState<AuthContextType>({ user: null, isVerified: false });


  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const email = localStorage.getItem('user_email');
    const role = localStorage.getItem('user_role') as UserRole;

    if (!token) {
      router.replace('/login');
    } else {
      setAuth({ user: { email, role }, isVerified: true });
    }
  }, [router]);

  if (!auth.isVerified) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
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
