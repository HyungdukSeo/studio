'use client'

import { mockBooks } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { BooksDataTable } from './data-table';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '../../layout';

export default function AdminBooksPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <PageHeader title="도서 관리">
        {isAdmin && (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                새 도서 추가
            </Button>
        )}
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <BooksDataTable columns={columns} data={mockBooks} />
      </div>
    </>
  );
}
