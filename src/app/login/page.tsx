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
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, AuthErrorCodes } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { mockMembers } from '@/lib/data';

const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해주세요.' }),
  password: z.string().min(4, { message: '비밀번호는 4자 이상이어야 합니다.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEFAULT_PASSWORD = '1234';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { auth, firestore, user, isUserLoading } = useFirebase();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: '오류', description: 'Firebase가 초기화되지 않았습니다.' });
        setIsLoading(false);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        loginSuccess(data.email);
    } catch (error: any) {
        if (error.code === AuthErrorCodes.INVALID_PASSWORD || error.code === AuthErrorCodes.USER_NOT_FOUND) {
            // 사용자가 없거나 비밀번호가 틀린 경우, 첫 로그인 시도를 확인
             try {
                const memberInfo = mockMembers.find(m => m.email === data.email);
                const isAdmin = data.email === 'root@ipageon.com';

                if ((memberInfo || isAdmin) && data.password === DEFAULT_PASSWORD) {
                    // 기본 비밀번호로 가입 시도
                    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                    
                    if (isAdmin) {
                        const adminRef = doc(firestore, "members", userCredential.user.uid);
                        await setDoc(adminRef, { id: userCredential.user.uid, email: data.email, name: '관리자', role: 'admin' });
                    } else if (memberInfo) {
                        const memberRef = doc(firestore, "members", userCredential.user.uid);
                        await setDoc(memberRef, { ...memberInfo, id: userCredential.user.uid });
                    }
                    
                    loginSuccess(data.email);
                } else {
                     toast({
                        variant: 'destructive',
                        title: '로그인 실패',
                        description: '이메일 또는 비밀번호가 올바르지 않거나, 첫 로그인의 경우 기본 비밀번호(1234)를 확인해주세요.',
                    });
                }
            } catch (creationError: any) {
                toast({
                    variant: 'destructive',
                    title: '오류',
                    description: creationError.message,
                });
            }
        } else {
            toast({
                variant: 'destructive',
                title: '로그인 실패',
                description: error.message,
            });
        }
    } finally {
        setIsLoading(false);
    }
  };
  
  const loginSuccess = (email: string) => {
    toast({
      title: '로그인 성공',
      description: `환영합니다, ${email}!`,
    });
    router.push('/dashboard');
  }

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
