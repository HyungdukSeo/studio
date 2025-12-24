'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { RentalInfo } from './page';
import type { Book } from '@/lib/types';
import { useAuth } from '../../layout';

const statusDisplay = {
  reserved: '예약 중',
  borrowed: '대여 중',
};

const statusStyles = {
  reserved: 'text-yellow-800 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  borrowed: 'text-red-800 bg-red-100 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
};

type ColumnsOptions = {
  onApproveLoan: (book: Book) => void;
  onExtendDueDate: (book: Book) => void;
  onConfirmReturn: (book: Book) => void;
};

export const columns = ({ onApproveLoan, onExtendDueDate, onConfirmReturn }: ColumnsOptions): ColumnDef<RentalInfo>[] => {
  const baseColumns: ColumnDef<RentalInfo>[] = [
    {
      accessorKey: 'memberName',
      header: '대여자',
      cell: ({ row }) => <div className="font-medium">{row.getValue('memberName')}</div>,
    },
    {
      accessorKey: 'title',
      header: '도서명',
    },
    {
      accessorKey: 'author',
      header: '저자',
    },
    {
      accessorKey: 'status',
      header: '상태',
      cell: ({ row }) => {
        const status = row.original.status;
        if (status !== 'borrowed' && status !== 'reserved') return null;

        return <Badge className={`${statusStyles[status]} whitespace-nowrap`}>{statusDisplay[status]}</Badge>;
      },
    },
    {
      accessorKey: 'dueDate',
      header: '반납 기한',
      cell: ({ row }) => {
        const book = row.original;
        if (book.status !== 'borrowed' || !book.dueDate) return null;
        return <span>{book.dueDate}</span>;
      },
    },
  ];
  
  baseColumns.push({
    id: 'actions',
    header: '관리',
    cell: function ActionsCell({ row }) {
      const book = row.original;
      const { user } = useAuth();
      const isAdmin = user?.role === 'admin';
      
      if (!isAdmin) {
        return null;
      }
      
      return (
        <div className="text-center space-x-2">
          {book.status === 'reserved' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApproveLoan(book)}
            >
              대여 승인
            </Button>
          )}
           {book.status === 'borrowed' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExtendDueDate(book)}
              >
                연장하기
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onConfirmReturn(book)}
              >
                반납 확인
              </Button>
            </>
          )}
        </div>
      );
    },
  });


  return baseColumns;
};
