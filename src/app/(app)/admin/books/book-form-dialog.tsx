'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { Book, BookStatus } from '@/lib/types';
import { useBooks } from '../../layout';

const bookSchema = z.object({
  title: z.string().min(1, '도서명을 입력해주세요.'),
  author: z.string().min(1, '저자를 입력해주세요.'),
  category: z.string().min(1, '분류를 입력해주세요.'),
  coverImage: z.string().url('유효한 URL을 입력해주세요.').or(z.literal('')),
  status: z.enum(['available', 'reserved', 'borrowed', 'lost']),
  description: z.string().optional(),
});

type BookFormValues = z.infer<typeof bookSchema>;

const statusDisplay: Record<BookStatus, string> = {
  available: '대여 가능',
  borrowed: '대여 중',
  reserved: '예약 중',
  lost: '분실',
};

interface BookFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  book?: Book;
}

export function BookFormDialog({ isOpen, onOpenChange, book }: BookFormDialogProps) {
  const { addBook, updateBook } = useBooks();

  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      category: '',
      coverImage: '',
      status: 'available',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (book) {
        form.reset({
          title: book.title,
          author: book.author,
          category: book.category,
          coverImage: book.coverImage,
          status: book.status,
          description: book.description,
        });
      } else {
        form.reset({
          title: '',
          author: '',
          category: '',
          coverImage: '',
          status: 'available',
          description: '',
        });
      }
    }
  }, [book, form, isOpen]);

  const onSubmit = (data: BookFormValues) => {
    if (book) {
      const updatedBook: Book = {
        ...book,
        ...data,
        reservedBy: data.status !== 'reserved' ? null : book.reservedBy,
      };
      updateBook(updatedBook);
    } else {
      addBook({
        title: data.title,
        author: data.author,
        category: data.category,
        coverImage: data.coverImage,
        description: data.description || '',
      });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{book ? '도서 수정' : '새 도서 추가'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>도서명</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>저자</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>분류</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="coverImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>표지 이미지 URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.jpg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>상태</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="상태를 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(Object.keys(statusDisplay) as BookStatus[]).map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusDisplay[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>설명</FormLabel>
                  <FormControl>
                    <Textarea placeholder="도서에 대한 설명을 입력하세요." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  취소
                </Button>
              </DialogClose>
              <Button type="submit">저장</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
