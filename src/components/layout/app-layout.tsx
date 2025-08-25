'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';
import { FloatingActionButton } from './floating-action-button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Don't show layout on auth pages
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Show FAB on home and library pages
  const showFAB = pathname === '/' || pathname?.startsWith('/library');
  // Allow wider content area on preview pages to make the book easier to read
  const isWidePreview = pathname?.startsWith('/create/preview') || pathname?.startsWith('/create/custom/preview');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header onMobileMenuToggle={() => setMobileMenuOpen(true)} />
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />

      {/* Main content */}
      <main className={cn(
        "min-h-[calc(100vh-4rem)]", // Account for header height
        "desktop:ml-64", // Desktop sidebar width
        "pb-20 desktop:pb-0" // Mobile nav height
      )}>
        <div className={cn(
          'container mx-auto p-4',
          isWidePreview ? 'max-w-[95vw]' : 'max-w-6xl'
        )}>
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileNav />
      
      {/* Floating Action Button */}
      <FloatingActionButton show={showFAB} />
    </div>
  );
}
