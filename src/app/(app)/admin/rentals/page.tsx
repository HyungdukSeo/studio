'use client';

import { useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { columns } from './columns';
import { RentalStatusTable } from './rental-status-table';
import { useAuth, useBooks } from '../../layout';
import { mockMembers } from '@/lib/data';
import type { Book, Member } from '@/lib/types';
import { format, addDays } from 'date-fns';

export type RentalInfo = Book & {
  memberName: string;
};

export default function AdminRentalsPage() {
  const { books, updateBook, addRental, endRental } = useBooks();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const handleApproveLoan = useCallback((book: Book) => {
    if (!book.reservedBy) return;
    const dueDate = addDays(new Date(), 7);
    const updatedBook = {
        ...book, 
        status: 'borrowed' as const,
        dueDate: format(dueDate, 'yyyy-MM-dd') 
    };
    updateBook(updatedBook);
    
    const member = mockMembers.find(m => m.email === book.reservedBy);
    if(member) {
        addRental({
            bookId: book.id,
            memberId: member.id,
            rentalDate: new Date(),
            returnDate: null,
            bookTitle: book.title,
            memberName: member.name
        });
    }

  }, [updateBook, addRental]);

  const handleExtendDueDate = useCallback((book: Book) => {
    if (!book.dueDate) return;
    const currentDueDate = new Date(book.dueDate);
    const newDueDate = addDays(currentDueDate, 7);
    updateBook({ ...book, dueDate: format(newDueDate, 'yyyy-MM-dd') });
  }, [updateBook]);
  
  const handleConfirmReturn = useCallback((book: Book) => {
    updateBook({ ...book, status: 'available', reservedBy: null, dueDate: null });
    endRental(book.id);
  }, [updateBook, endRental]);


  const rentalData: RentalInfo[] = useMemo(() => {
    const rentedBooks = books.filter(book => book.status === 'borrowed' || book.status === 'reserved');
    
    return rentedBooks.map(book => {
      const member = mockMembers.find(m => m.email === book.reservedBy);
      return {
        ...book,
        memberName: member?.name || '정보 없음',
      };
    }).sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [books]);
  
  const dynamicColumns = useMemo(() => columns({ 
    onApproveLoan: handleApproveLoan,
    onExtendDueDate: handleExtendDueDate,
    onConfirmReturn: handleConfirmReturn
  }), [handleApproveLoan, handleExtendDueDate, handleConfirmReturn]);

  return (
    <>
      <PageHeader title="전체 대여 현황" />
      <div className="rounded-lg border shadow-sm">
        <RentalStatusTable columns={dynamicColumns} data={rentalData} />
      </div>
    </>
  );
}
