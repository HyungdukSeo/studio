'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Member } from '@/lib/types';

type ColumnsOptions = {
  isAdmin: boolean;
};

export const columns = ({ isAdmin }: ColumnsOptions): ColumnDef<Member>[] => [
  {
    accessorKey: 'name',
    header: '이름',
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'email',
    header: '이메일',
  },
  {
    id: 'actions',
    cell: function ActionsCell({ row }) {
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
              <DropdownMenuItem>회원 수정</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">회원 삭제</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
