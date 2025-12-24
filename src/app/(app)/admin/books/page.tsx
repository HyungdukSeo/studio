'use client'

import { useState } from 'react';
import type { Book } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { BooksDataTable } from './data-table';
import { PlusCircle } from 'lucide-react';
import { useAuth, useBooks } from '../../layout';
import { BookFormDialog } from './book-form-dialog';

export default function AdminBooksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { books, deleteBook, updateBook, members } = useBooks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | undefined>(undefined);

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
    deleteBook(bookId);
  }
  
  const handleConfirmReturn = (book: Book) => {
    updateBook({ ...book, status: 'available', reservedBy: null });
  };

  const dynamicColumns = columns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete,
    onConfirmReturn: handleConfirmReturn,
    members: members,
  });


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
        book={editingBook}
      />
    </>
  );
}
