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

  const menuItems = [
    { href: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { href: '/admin/books', label: '도서 관리', icon: Book },
    { href: '/admin/members', label: '회원 관리', icon: Users },
    { href: '/admin/reports', label: '리포트', icon: LineChart },
  ];

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
