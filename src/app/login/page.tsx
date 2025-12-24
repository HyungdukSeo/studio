'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BookMarked } from 'lucide-react';
import { mockMembers } from '@/lib/data';

const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해주세요.' }),
  password: z.string().min(1, { message: '비밀번호를 입력해주세요.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEFAULT_PASSWORD = '1234';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (localStorage.getItem('auth_token')) {
      router.replace('/dashboard');
    }
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    setIsLoading(true);
    setTimeout(() => {
      const isAdminUser = data.email === 'root@ipageon.com';
      const isMemberUser = mockMembers.some(member => member.email === data.email);

      if (isAdminUser || isMemberUser) {
        const passwordKey = `password_${data.email}`;
        const storedPassword = localStorage.getItem(passwordKey);

        if (storedPassword) {
            // 이미 비밀번호가 설정된 사용자
            if (data.password === storedPassword) {
                const role = isAdminUser ? 'admin' : 'member';
                loginSuccess(data.email, role);
            } else {
                toast({
                    variant: 'destructive',
                    title: '로그인 실패',
                    description: '비밀번호가 올바르지 않습니다.',
                });
            }
        } else {
            // 첫 로그인 사용자 (비밀번호 '1234' 확인)
            if (data.password === DEFAULT_PASSWORD) {
                localStorage.setItem(passwordKey, data.password); // 다음 로그인을 위해 기본 비밀번호 저장
                const role = isAdminUser ? 'admin' : 'member';
                loginSuccess(data.email, role);
            } else {
                 toast({
                    variant: 'destructive',
                    title: '로그인 실패',
                    description: `첫 로그인이거나 비밀번호가 초기화된 경우, 기본 비밀번호(${DEFAULT_PASSWORD})를 입력해주세요.`,
                });
            }
        }
      } else {
        toast({
          variant: 'destructive',
          title: '로그인 실패',
          description: '가입되지 않은 회원이거나 정보가 잘못되었습니다.',
        });
      }
      setIsLoading(false);
    }, 500);
  };
  
  const loginSuccess = (email: string, role: 'admin' | 'member') => {
    localStorage.setItem('auth_token', 'mock_user_token');
    localStorage.setItem('user_email', email);
    localStorage.setItem('user_role', role);
    
    toast({
      title: '로그인 성공',
      description: '돌아오신 것을 환영합니다!',
    });
    router.push('/dashboard');
  }


  if (!isClient) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <BookMarked className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">을야지람</CardTitle>
          <CardDescription>계정에 접근하려면 정보를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>이메일</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>비밀번호</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
