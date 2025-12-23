'use client'

import { mockMembers } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { MembersDataTable } from './data-table';
import { PlusCircle } from 'lucide-react';
import { useAuth } from '../../layout';

export default function AdminMembersPage() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

  return (
    <>
      <PageHeader title="Manage Members">
        {isAdmin && (
            <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Member
            </Button>
        )}
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <MembersDataTable columns={columns} data={mockMembers} />
      </div>
    </>
  );
}
