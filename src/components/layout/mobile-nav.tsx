'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Plus, 
  Library, 
  Package, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/lib/constants';

const iconMap = {
  home: Home,
  plus: Plus,
  library: Library,
  package: Package,
  user: User,
};

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="desktop:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border/50">
      <div className="flex items-center justify-around py-2 px-1">
        {NAVIGATION.MOBILE.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0 flex-1 min-h-[50px] justify-center",
                isActive 
                  ? "text-primary bg-primary/10 font-bold" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium truncate leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}