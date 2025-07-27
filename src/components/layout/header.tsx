'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { Search, Bell, HelpCircle, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState('');

  // Disable search on certain pages
  const searchDisabled = pathname === '/' || pathname.startsWith('/create');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Left side - Logo only (removed hamburger menu for mobile) */}
        <div className="flex items-center gap-4">
          {/* Logo - Larger and more prominent for elderly users */}
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-base sm:text-lg">SM</span>
            </div>
            <span className="font-bold text-xl sm:text-2xl text-foreground">StoryMosaic</span>
          </Link>
        </div>

        {/* Center - Search (desktop only) */}
        <div className="hidden desktop:flex flex-1 max-w-md mx-8">
          <div className={cn(
            "relative w-full",
            searchDisabled && "opacity-50 pointer-events-none"
          )}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              disabled={searchDisabled}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
            {/* Notification badge */}
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-coral rounded-full border-2 border-background"></div>
          </Button>

          {/* Help */}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/help">
              <HelpCircle className="h-5 w-5" />
              <span className="sr-only">Help</span>
            </Link>
          </Button>

          {/* User menu */}
          {(() => {
            const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
            const hasValidClerk = publishableKey && publishableKey !== '' && !publishableKey.includes('placeholder');
            return hasValidClerk;
          })() ? (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">
                <User className="h-5 w-5" />
                <span className="sr-only">Sign in</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}