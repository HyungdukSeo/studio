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
import { LogOut, User, Lock } from 'lucide-react';
import { useAuth } from '@/app/(app)/layout';
import { useToast } from '@/hooks/use-toast';
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
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_role');
    router.push('/login');
  };
  
  const handlePasswordChange = () => {
    if (!user?.email) return;
    
    if (!newPassword || newPassword.length < 4) {
        toast({
            variant: 'destructive',
            title: '오류',
            description: '새 비밀번호는 4자 이상이어야 합니다.',
        });
        return;
    }

    const passwordKey = `password_${user.email}`;
    localStorage.setItem(passwordKey, newPassword);
    toast({
      title: '성공',
      description: '비밀번호가 성공적으로 변경되었습니다.',
    });
    setIsPasswordDialogOpen(false);
    setNewPassword('');
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : '?';

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
              <p className="text-sm font-medium leading-none">로그인 계정</p>
              <p className="text-xs leading-none text-muted-foreground truncate">{user?.email}</p>
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
              새 비밀번호를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
                <Button type="button" variant="secondary">취소</Button>
            </DialogClose>
            <Button type="button" onClick={handlePasswordChange}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
