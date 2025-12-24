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
import { signInWithEmailAndPassword, AuthErrorCodes, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { mockMembers } from '@/lib/data';
import type { Member } from '@/lib/types';


const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 6자 이상이어야 합니다.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPageLoading, setIsPageLoading] = useState(true);
  const { auth, user, isUserLoading, firestore } = useFirebase();

  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        router.replace('/dashboard');
      } else {
        setIsPageLoading(false);
      }
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
    setIsPageLoading(true);
    if (!auth || !firestore) {
        toast({ variant: 'destructive', title: '오류', description: 'Firebase가 초기화되지 않았습니다.' });
        setIsPageLoading(false);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: '로그인 성공',
          description: `환영합니다, ${data.email}!`,
        });
        // The useEffect will handle the redirect
    } catch (error: any) {
        if (error.code === AuthErrorCodes.INVALID_CREDENTIAL) {
            // User does not exist or password incorrect. Try to create a new user if it's one of our mock users.
            const allMockUsers = [...mockMembers, { name: '관리자', email: 'root@ipageon.com', role: 'admin' as const }];
            const mockUser = allMockUsers.find(m => m.email.toLowerCase() === data.email.toLowerCase());
            
            if (mockUser && data.password === '123456') {
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                    const newUser = userCredential.user;

                    // Save member details to Firestore with UID as document ID
                    const memberDocRef = doc(firestore, 'members', newUser.uid);
                    const newMemberData: Member = {
                        id: newUser.uid,
                        email: mockUser.email,
                        name: mockUser.name,
                        role: mockUser.role || 'member',
                    };
                    await setDoc(memberDocRef, newMemberData);

                    // Also create a reference by email for the layout to find
                    const memberByEmailDocRef = doc(firestore, 'members', mockUser.email);
                    await setDoc(memberByEmailDocRef, newMemberData);
                    
                    toast({
                      title: '계정 생성 및 로그인 성공',
                      description: `환영합니다, ${data.email}!`,
                    });
                    // Login successful, redirect is handled by useEffect
                } catch (creationError: any) {
                    toast({
                        variant: 'destructive',
                        title: '계정 생성 실패',
                        description: '계정을 생성하는 중 오류가 발생했습니다: ' + creationError.message,
                    });
                    setIsPageLoading(false);
                }
            } else {
                 toast({
                    variant: 'destructive',
                    title: '로그인 실패',
                    description: '이메일 또는 비밀번호가 올바르지 않습니다.',
                });
                setIsPageLoading(false);
            }
        } else {
            toast({
                variant: 'destructive',
                title: '로그인 오류',
                description: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            });
            console.error(error);
            setIsPageLoading(false);
        }
    } 
  };

  if (isUserLoading || user || isPageLoading) {
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
              <Button type="submit" className="w-full" disabled={isPageLoading}>
                로그인
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
