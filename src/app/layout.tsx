import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import SyncManager from '@/components/SyncManager'; // SyncManager 임포트
import './globals.css';

export const metadata: Metadata = {
  title: '을야지람',
  description: '현대적인 도서 대여 시스템입니다.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {/* SyncManager가 배경에서 실시간으로 서버와 데이터를 주고받습니다 */}
        <SyncManager />
        
        {children}
        <Toaster />
      </body>
    </html>
  );
}