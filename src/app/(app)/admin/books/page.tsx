import { mockBooks } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { columns } from './columns';
import { BooksDataTable } from './data-table';
import { PlusCircle } from 'lucide-react';

export default function AdminBooksPage() {
  return (
    <>
      <PageHeader title="Manage Books">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Book
        </Button>
      </PageHeader>
      <div className="rounded-lg border shadow-sm">
        <BooksDataTable columns={columns} data={mockBooks} />
      </div>
    </>
  );
}
