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
import { mockMembers } from '@/lib/data';
import { collection, doc, getDocs, query, writeBatch } from 'firebase/firestore';
import type { Member } from '@/lib/types';

const loginSchema = z.object({
  email: z.string().email({ message: '올바른 이메일 주소를 입력해주세요.' }),
  password: z.string().min(6, { message: '비밀번호는 6자 이상이어야 합니다.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const { auth, user, isUserLoading, firestore } = useFirebase();

  useEffect(() => {
    const seedInitialUsers = async () => {
        if (!auth || !firestore) return;
        
        // Check if seeding has already been done
        const membersSnapshot = await getDocs(query(collection(firestore, 'members')));
        if (!membersSnapshot.empty) {
            setIsLoading(false);
            return;
        }

        console.log("Seeding initial users...");

        const allUsersToSeed = [
            ...mockMembers,
            { name: '관리자', email: 'root@ipageon.com', role: 'admin' as const }
        ];
        const DEFAULT_PASSWORD = '123456';

        try {
            // Use a temporary, detached Auth instance for seeding to avoid conflicts
            const tempAuth = auth;
            
            const authPromises = allUsersToSeed.map(member => 
                createUserWithEmailAndPassword(tempAuth, member.email, DEFAULT_PASSWORD)
                    .then(userCredential => ({ member, userCredential }))
                    .catch(error => {
                        if (error.code === 'auth/email-already-in-use') {
                            console.log(`User ${member.email} already exists in Auth. Skipping creation.`);
                            return null; // Skip if user already exists in auth
                        }
                        console.error(`Error creating auth user ${member.email}:`, error);
                        throw error; // Re-throw other errors
                    })
            );

            const results = await Promise.all(authPromises);

            const batch = writeBatch(firestore);
            results.forEach(result => {
                if (result) {
                    const { member, userCredential } = result;
                    const newUser = userCredential.user;
                    const memberDocRef = doc(firestore, 'members', newUser.uid);
                    const newMemberData: Member = {
                        id: newUser.uid,
                        email: member.email,
                        name: member.name,
                        role: member.role || 'member',
                    };
                    batch.set(memberDocRef, newMemberData);
                }
            });

            await batch.commit();
            console.log("Initial user seeding complete.");
        } catch (error) {
            console.error("Error during user seeding:", error);
            toast({
                variant: "destructive",
                title: "초기화 오류",
                description: "초기 사용자 정보 설정에 실패했습니다.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    seedInitialUsers();
  }, [auth, firestore, toast]);

  useEffect(() => {
    if (!isUserLoading && user && !isLoading) {
      router.replace('/dashboard');
    }
  }, [user, isUserLoading, router, isLoading]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: '오류', description: 'Firebase가 초기화되지 않았습니다.' });
        setIsLoading(false);
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
            toast({
                variant: 'destructive',
                title: '로그인 실패',
                description: '이메일 또는 비밀번호가 올바르지 않습니다.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: '로그인 오류',
                description: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            });
            console.error(error);
        }
    } finally {
        setIsLoading(false);
    }
  };

  if (isUserLoading || user || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        {isLoading && <p className="ml-4">초기 사용자 정보를 설정하는 중입니다...</p>}
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
                로그인
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
