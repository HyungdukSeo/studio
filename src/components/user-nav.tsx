'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Lock, Database } from 'lucide-react';
import { useAuth } from '@/app/(app)/layout';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


export function UserNav() {
  const router = useRouter();
  const authContext = useAuth();
  const { auth, user: firebaseUser } = useFirebase();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/login');
  };

  const handleSeedData = () => {
    if (authContext?.user?.role === 'admin' && authContext.seedInitialData) {
      authContext.seedInitialData();
    } else {
      toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '관리자만 이 작업을 수행할 수 있습니다.',
      });
    }
  };
  
  const handlePasswordChange = async () => {
    if (!firebaseUser || !firebaseUser.email) {
        toast({ variant: 'destructive', title: '오류', description: '사용자 정보가 없습니다.' });
        return;
    }
    
    if (!newPassword || newPassword.length < 6) {
        toast({
            variant: 'destructive',
            title: '오류',
            description: '새 비밀번호는 6자 이상이어야 합니다.',
        });
        return;
    }
    
    if (!currentPassword) {
      toast({
          variant: 'destructive',
          title: '오류',
          description: '현재 비밀번호를 입력해주세요.',
      });
      return;
    }

    try {
        const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, newPassword);

        toast({
            title: '성공',
            description: '비밀번호가 성공적으로 변경되었습니다.',
        });
        setIsPasswordDialogOpen(false);
        setNewPassword('');
        setCurrentPassword('');
    } catch (error: any) {
        console.error("Password update error:", error);
        let description = '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도해주세요.';
        if (error.code === 'auth/wrong-password') {
          description = '현재 비밀번호가 올바르지 않습니다.';
        } else if (error.code === 'auth/too-many-requests') {
          description = '너무 많은 요청이 있었습니다. 잠시 후 다시 시도해주세요.';
        }
        toast({
            variant: 'destructive',
            title: '비밀번호 변경 실패',
            description: description,
        });
    }
  };

  const userInitial = authContext?.user?.email ? authContext.user.email.charAt(0).toUpperCase() : '?';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatars/01.png" alt="사용자 아바타" />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{authContext?.user?.name}</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{authContext?.user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem disabled>
              <User className="mr-2 h-4 w-4" />
              <span>프로필</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsPasswordDialogOpen(true)}>
                <Lock className="mr-2 h-4 w-4" />
                <span>비밀번호 변경</span>
            </DropdownMenuItem>
            {authContext?.user?.role === 'admin' && (
              <DropdownMenuItem onClick={handleSeedData}>
                <Database className="mr-2 h-4 w-4" />
                <span>초기 데이터 설정</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>로그아웃</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
            <DialogDescription>
              보안을 위해 현재 비밀번호와 새 비밀번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-password" className="text-right">
                현재 비밀번호
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-password" className="text-right">
                새 비밀번호
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary" onClick={() => {
                  setCurrentPassword('');
                  setNewPassword('');
                }}>취소</Button>
            </DialogClose>
            <Button type="button" onClick={handlePasswordChange}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
