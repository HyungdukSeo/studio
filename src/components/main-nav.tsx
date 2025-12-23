'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Book, LayoutDashboard, LineChart, Users } from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/app/(app)/layout';

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const allMenuItems = [
    { href: '/dashboard', label: '대시보드', icon: LayoutDashboard, adminOnly: false },
    { href: '/admin/books', label: '도서 관리', icon: Book, adminOnly: true },
    { href: '/admin/members', label: '회원 관리', icon: Users, adminOnly: true },
    { href: '/admin/reports', label: '리포트', icon: LineChart, adminOnly: true },
  ];
  
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className={cn('flex flex-col', className)}>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={{ children: item.label }}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
