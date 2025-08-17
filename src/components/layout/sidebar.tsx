'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Plus, 
  Library, 
  Package, 
  HelpCircle, 
  User, 
  Wand2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAVIGATION } from '@/lib/constants';

const iconMap = {
  home: Home,
  plus: Plus,
  wand2: Wand2,
  library: Library,
  package: Package,
  'help-circle': HelpCircle,
  user: User,
};

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden desktop:flex desktop:w-64 desktop:flex-col desktop:fixed desktop:inset-y-0 desktop:left-0 desktop:top-16 desktop:border-r desktop:bg-background">
        <nav className="flex-1 p-4 space-y-2">
          {NAVIGATION.DESKTOP.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="desktop:hidden fixed inset-0 z-50 bg-black/50" onClick={onClose}>
          <aside 
            className="fixed inset-y-0 left-0 w-64 bg-background border-r shadow-lg transform transition-transform"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">SM</span>
                </div>
                <span className="font-bold text-lg text-foreground">StoryMosaic</span>
              </div>
              
              <nav className="space-y-2">
                {NAVIGATION.DESKTOP.map((item) => {
                  const Icon = iconMap[item.icon as keyof typeof iconMap];
                  const isActive = pathname === item.href || 
                    (item.href !== '/' && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
