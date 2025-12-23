'use client'

import { useState } from 'react';
import { mockBooks as initialMockBooks } from '@/lib/data';
import type { Book } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { BooksDataTable } from './data-table';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '../../layout';
import { BookFormDialog } from './book-form-dialog';

export default function AdminBooksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [books, setBooks] = useState<Book[]>(initialMockBooks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);

  const handleBookSave = (savedBook: Book) => {
    if (editingBook) {
      setBooks(books.map(b => b.id === savedBook.id ? savedBook : b));
    } else {
      const newBook = { ...savedBook, id: `book-${Date.now()}`};
      setBooks([newBook, ...books]);
    }
  };

  const handleEdit = (book: Book) => {
    setEditingBook(book);
    setIsFormOpen(true);
  }

  const handleAdd = () => {
    setEditingBook(undefined);
    setIsFormOpen(true);
  }

  const handleDialogClose = () => {
    setIsFormOpen(false);
    setEditingBook(undefined);
  }

  const handleDelete = (bookId: string) => {
    setBooks(books.filter(b => b.id !== bookId));
  }

  const dynamicColumns = columns({ onEdit: handleEdit, onDelete: handleDelete });


  return (
    <>
      <PageHeader title="도서 관리">
        {isAdmin && (
            <Button onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                새 도서 추가
            </Button>
        )}
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <BooksDataTable columns={dynamicColumns} data={books} />
      </div>

      <BookFormDialog 
        isOpen={isFormOpen}
        onOpenChange={handleDialogClose}
        onSave={handleBookSave}
        book={editingBook}
      />
    </>
  );
}
