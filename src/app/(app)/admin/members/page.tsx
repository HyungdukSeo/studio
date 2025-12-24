'use client'

import { useBooks, useAuth } from '../../layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { MembersDataTable } from './data-table';
import { PlusCircle } from 'lucide-react';

export default function AdminMembersPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const { members } = useBooks();

  return (
    <>
      <PageHeader title="회원 관리">
        {isAdmin && (
            <Button disabled>
                <PlusCircle className="mr-2 h-4 w-4" />
                새 회원 추가
            </Button>
        )}
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <MembersDataTable columns={columns} data={members} />
      </div>
    </>
  );
}
