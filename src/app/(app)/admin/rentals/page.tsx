'use client';

import { useMemo, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';
import { columns } from './columns';
import { RentalStatusTable } from './rental-status-table';
import { useBooks } from '../../layout';
import { mockMembers } from '@/lib/data';
import type { Book, Member } from '@/lib/types';

export type RentalInfo = Book & {
  memberName: string;
  dueDate: string;
};

const calculateDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date.toLocaleDateString('ko-KR');
}

export default function AdminRentalsPage() {
  const { books, updateBook } = useBooks();

  const handleApproveLoan = useCallback((book: Book) => {
    updateBook({ ...book, status: 'borrowed' });
  }, [updateBook]);

  const rentalData: RentalInfo[] = useMemo(() => {
    const rentedBooks = books.filter(book => book.status === 'borrowed' || book.status === 'reserved');
    
    return rentedBooks.map(book => {
      const member = mockMembers.find(m => m.email === book.reservedBy);
      return {
        ...book,
        memberName: member?.name || '정보 없음',
        dueDate: calculateDueDate(),
      };
    }).sort((a, b) => a.memberName.localeCompare(b.memberName));
  }, [books]);
  
  const dynamicColumns = useMemo(() => columns({ onApproveLoan: handleApproveLoan }), [handleApproveLoan]);

  return (
    <>
      <PageHeader title="전체 대여 현황" />
      <div className="rounded-lg border shadow-sm">
        <RentalStatusTable columns={dynamicColumns} data={rentalData} />
      </div>
    </>
  );
}
