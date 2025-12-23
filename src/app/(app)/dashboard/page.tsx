'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { mockBooks } from '@/lib/data';
import type { Book, BookStatus } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../layout';
import { useToast } from '@/hooks/use-toast';

const statusStyles: Record<BookStatus, string> = {
  available: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  borrowed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
};

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  const handleBorrow = (book: Book) => {
    toast({
        title: "Rental Request",
        description: `Your request to borrow "${book.title}" has been submitted.`
    })
  }

  const categories = useMemo(() => ['all', ...Array.from(new Set(mockBooks.map((b) => b.category)))], []);
  
  const filteredBooks = useMemo(() => {
    return mockBooks.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  return (
    <>
      <PageHeader title={user?.role === 'admin' ? "Book Collection Overview" : "Book Collection"} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBooks.map((book) => (
          <Card key={book.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
            <CardHeader className="p-0">
               <Image
                  src={book.coverImage}
                  alt={`Cover of ${book.title}`}
                  width={400}
                  height={600}
                  className="w-full h-48 object-cover"
                  data-ai-hint={book.imageHint}
                />
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <CardTitle className="mb-1 text-lg font-bold font-headline leading-tight">{book.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {book.author}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
                <Badge className={statusStyles[book.status]}>{book.status}</Badge>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={book.status !== 'available'}
                    onClick={() => handleBorrow(book)}
                >
                  Borrow
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {filteredBooks.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
              No books found matching your criteria.
          </div>
       )}
    </>
  );
}
