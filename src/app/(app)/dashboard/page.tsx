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

const statusDisplay: Record<BookStatus, string> = {
  available: '대여 가능',
  borrowed: '대여 중',
  reserved: '예약 중',
};

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
        title: "대여 요청",
        description: `"${book.title}" 도서 대여를 요청했습니다.`
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
      <PageHeader title={user?.role === 'admin' ? "도서 관리 현황" : "도서 목록"} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목 또는 저자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="분류로 필터링" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat === 'all' ? '모든 분류' : cat}
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
                  alt={`${book.title} 표지`}
                  width={400}
                  height={600}
                  className="w-full h-48 object-cover"
                  data-ai-hint={book.imageHint}
                />
            </CardHeader>
            <CardContent className="flex-grow p-4">
              <CardTitle className="mb-1 text-lg font-bold font-headline leading-tight">{book.title}</CardTitle>
              <p className="text-sm text-muted-foreground">저자: {book.author}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center p-4 pt-0">
                <Badge className={statusStyles[book.status]}>{statusDisplay[book.status]}</Badge>
                <Button 
                    variant="outline" 
                    size="sm" 
                    disabled={book.status !== 'available'}
                    onClick={() => handleBorrow(book)}
                >
                  대여하기
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
       {filteredBooks.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
              검색 조건에 맞는 도서가 없습니다.
          </div>
       )}
    </>
  );
}
