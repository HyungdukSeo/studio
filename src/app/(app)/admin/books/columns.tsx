'use client';

import type { ColumnDef } from '@tanstack/react-table';
import Image from 'next/image';
import { MoreHorizontal, Book as BookIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Book, BookStatus, Member } from '@/lib/types';
import { useAuth } from '../../layout';

const statusDisplay: Record<BookStatus, string> = {
  available: '대여 가능',
  reserved: '예약 중',
  borrowed: '대여 중',
  lost: '분실',
};

const statusStyles: Record<BookStatus, string> = {
  available: 'text-green-800 bg-green-100 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  reserved: 'text-yellow-800 bg-yellow-100 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  borrowed: 'text-red-800 bg-red-100 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  lost: 'text-gray-800 bg-gray-100 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700',
};

type ColumnsOptions = {
  onEdit: (book: Book) => void;
  onDelete: (bookId: string) => void;
  members: Member[];
};

const handleRequestReturn = (book: Book) => {
  if (!book.reservedBy) return;
  const subject = `도서반납요청의 건`;
  const body = `빌려가신 "${book.title}" 의 반납을 요청드립니다.`;
  window.location.href = `mailto:${book.reservedBy}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};

export const columns = ({ onEdit, onDelete, members }: ColumnsOptions): ColumnDef<Book>[] => [
  {
    accessorKey: 'coverImage',
    header: '이미지',
    cell: ({ row }) => {
      const book = row.original;
      return (
        <div className="w-12 h-16 flex items-center justify-center">
            {book.coverImage ? (
                <Image
                    src={book.coverImage}
                    alt={`${book.title} 표지`}
                    width={48}
                    height={64}
                    className="w-full h-full object-contain rounded-sm"
                    data-ai-hint={book.imageHint}
                />
            ) : (
                <div className="w-12 h-16 bg-muted flex items-center justify-center rounded-sm">
                    <BookIcon className="w-6 h-6 text-muted-foreground" />
                </div>
            )}
        </div>
      )
    },
  },
  {
    accessorKey: 'title',
    header: '도서명',
    cell: ({ row }) => <div className="font-medium">{row.getValue('title')}</div>,
  },
  {
    accessorKey: 'author',
    header: '저자',
  },
  {
    accessorKey: 'category',
    header: '분류',
  },
  {
    accessorKey: 'status',
    header: '상태',
    cell: ({ row }) => {
      const book = row.original;
      const status = book.status;
      let statusText = statusDisplay[status];
      
      if ((status === 'borrowed' || status === 'reserved') && book.reservedBy) {
          const member = members.find(m => m.email === book.reservedBy);
          if (member) {
              statusText = `${statusDisplay[status]}: ${member.name}`;
          }
      }

      return <Badge className={`${statusStyles[status]} whitespace-nowrap`}>{statusText}</Badge>;
    },
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
      const book = row.original;
      const { user } = useAuth();
      const isAdmin = user?.role === 'admin';

      if (!isAdmin) {
        return null;
      }
      
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">메뉴 열기</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>작업</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(book.id)}>
                도서 ID 복사
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(book)}>도서 수정</DropdownMenuItem>
              {(book.status === 'borrowed' || book.status === 'reserved') && (
                <DropdownMenuItem onClick={() => handleRequestReturn(book)}>
                  반납 요청
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={() => onDelete(book.id)}
              >
                도서 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
