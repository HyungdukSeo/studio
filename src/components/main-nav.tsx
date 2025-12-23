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
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { href: '/admin/books', label: 'Books', icon: Book, adminOnly: true },
    { href: '/admin/members', label: 'Members', icon: Users, adminOnly: true },
    { href: '/admin/reports', label: 'Reports', icon: LineChart, adminOnly: true },
  ];
  
  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className={cn('flex flex-col', className)}>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname.startsWith(item.href)}
                tooltip={{ children: item.label }}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
