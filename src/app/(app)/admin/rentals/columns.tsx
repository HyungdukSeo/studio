'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import type { RentalInfo } from './page';

const statusDisplay = {
  reserved: '예약 중',
  borrowed: '대여 중',
};

const statusStyles = {
  reserved: 'text-yellow-800 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  borrowed: 'text-red-800 bg-red-100 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
};

export const columns: ColumnDef<RentalInfo>[] = [
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
  }
];
