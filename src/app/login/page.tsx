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
import { useFirebase } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthError } from 'firebase/auth';

const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 6자 이상이어야 합니다.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { auth, user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '123456',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    if (!auth) {
      toast({ variant: 'destructive', title: '오류', description: 'Firebase가 초기화되지 않았습니다.' });
      setIsSubmitting(false);
      return;
    }
  
    try {
      // 1. First, try to sign in
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: '로그인 성공',
        description: `환영합니다, ${data.email}!`,
      });
      // On successful login, the useEffect will redirect to /dashboard
  
    } catch (error) {
      const authError = error as AuthError;
  
      // 2. If user does not exist, create a new account
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, data.email, data.password);
          toast({
            title: '계정 생성 완료',
            description: '계정이 성공적으로 생성되었습니다. 다시 로그인해주세요.',
          });
          // Clear password field to prompt re-login
          form.reset({ email: data.email, password: '' });

        } catch (creationError) {
          const creationAuthError = creationError as AuthError;
          toast({
            variant: 'destructive',
            title: '가입 실패',
            description: `계정 생성 중 오류가 발생했습니다: ${creationAuthError.message}`,
          });
        }
      } else {
        // 3. Handle other login errors
        toast({
          variant: 'destructive',
          title: '로그인 오류',
          description: authError.message || '알 수 없는 오류가 발생했습니다.',
        });
        console.error("Login error:", authError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
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
                      <Input placeholder="name@example.com" {...field} disabled={isSubmitting}/>
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
                      <Input type="password" placeholder="••••••••" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                로그인 또는 가입
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
