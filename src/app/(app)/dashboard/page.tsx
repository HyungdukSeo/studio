'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { Book, BookStatus } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Book as BookIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useBooks } from '../layout';
import { useToast } from '@/hooks/use-toast';

const statusDisplay: Record<BookStatus, string> = {
  available: '대여 가능',
  reserved: '예약 중',
  borrowed: '대여 중',
  lost: '분실',
};

const statusFilterOptions: Record<string, string> = {
  all: '모든 상태',
  my: '내가 대여/예약한 도서',
  available: '대여 가능',
  reserved: '예약 중',
};

const statusStyles: Record<BookStatus, string> = {
  available: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  reserved: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
  borrowed: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
  lost: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/50 dark:text-gray-300 dark:border-gray-700',
};

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const { books, updateBook } = useBooks();
  const { toast } = useToast();

  const handleToggleReservation = (book: Book) => {
    if (!user || !user.email) return;

    if (book.status === 'available') {
      updateBook({ ...book, status: 'reserved', reservedBy: user.email });
      toast({
        title: '예약 완료',
        description: `"${book.title}" 도서를 예약했습니다. 관리자 승인 후 대여가 완료됩니다.`,
      });
    } else if (book.status === 'reserved' && book.reservedBy === user.email) {
      updateBook({ ...book, status: 'available', reservedBy: null });
      toast({
        title: '예약 취소',
        description: `"${book.title}" 도서 예약을 취소했습니다.`,
      });
    } else if (book.status === 'borrowed' && book.reservedBy === user.email) {
       toast({
        variant: 'destructive',
        title: '반납 불가',
        description: '도서 반납은 관리자에게 문의해주세요.',
      });
    } else {
       toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '다른 사람이 예약/대여한 도서는 변경할 수 없습니다.',
      });
    }
  };
  
  const categories = useMemo(() => ['all', ...Array.from(new Set(books.map((b) => b.category)))], [books]);
  
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter;
      
      const matchesStatus = () => {
        switch (statusFilter) {
          case 'all':
            return true;
          case 'my':
            return (book.status === 'reserved' || book.status === 'borrowed') && book.reservedBy === user?.email;
          case 'available':
          case 'reserved':
            return book.status === statusFilter;
          default:
            return true;
        }
      };

      return matchesSearch && matchesCategory && matchesStatus();
    });
  }, [searchTerm, categoryFilter, statusFilter, books, user?.email]);

  const getButtonInfo = (book: Book): { text: string; disabled: boolean; variant: "outline" | "default" } => {
    const isMyReservation = book.reservedBy === user?.email;

    switch (book.status) {
        case 'available':
            return { text: '예약하기', disabled: false, variant: 'outline' };
        case 'reserved':
            if (isMyReservation) {
                return { text: '예약 취소', disabled: false, variant: 'default' };
            }
            return { text: '예약 중', disabled: true, variant: 'outline' };
        case 'borrowed':
            if (isMyReservation) {
                return { text: '대여 중', disabled: true, variant: 'default' };
            }
            return { text: '대여 중', disabled: true, variant: 'outline' };
        case 'lost':
            return { text: '분실', disabled: true, variant: 'outline' };
        default:
            return { text: '상태 확인', disabled: true, variant: 'outline' };
    }
  }

  return (
    <>
      <PageHeader title={user?.role === 'admin' ? "도서 관리 현황" : "도서 목록"} />
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        <div className="relative flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="제목 또는 저자로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-4">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full flex-1 sm:w-[180px]">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full flex-1 sm:w-[180px]">
                    <SelectValue placeholder="상태로 필터링" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(statusFilterOptions).map(([key, value]) => (
                        <SelectItem key={key} value={key}>
                            {value}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredBooks.map((book) => {
           const buttonInfo = getButtonInfo(book);
           return (
            <Card key={book.id} className="flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
                <CardHeader className="p-0 relative">
                {book.coverImage ? (
                    <Image
                        src={book.coverImage}
                        alt={`${book.title} 표지`}
                        width={400}
                        height={600}
                        className="w-full h-48 object-cover"
                        data-ai-hint={book.imageHint}
                    />
                ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <BookIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                )}
                </CardHeader>
                <CardContent className="flex-grow p-4">
                <CardTitle className="mb-1 text-lg font-bold font-headline leading-tight">{book.title}</CardTitle>
                <p className="text-sm text-muted-foreground">저자: {book.author}</p>
                </CardContent>
                <CardFooter className="flex justify-between items-center p-4 pt-0">
                    <Badge className={statusStyles[book.status]}>{statusDisplay[book.status]}</Badge>
                    <Button 
                        variant={buttonInfo.variant} 
                        size="sm" 
                        disabled={buttonInfo.disabled}
                        onClick={() => handleToggleReservation(book)}
                    >
                        {buttonInfo.text}
                    </Button>
                </CardFooter>
            </Card>
           )
        })}
      </div>
       {filteredBooks.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
              검색 조건에 맞는 도서가 없습니다.
          </div>
       )}
    </>
  );
}
