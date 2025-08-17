'use client';

import Link from 'next/link';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  className?: string;
  show?: boolean;
}

export function FloatingActionButton({ className, show = true }: FloatingActionButtonProps) {
  if (!show) return null;

  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "desktop:hidden fixed bottom-16 right-4 z-30 h-14 w-14 rounded-full shadow-lg",
        "bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:brightness-110 text-white",
        className
      )}
    >
      <Link href="/create">
        <Wand2 className="h-6 w-6" />
        <span className="sr-only">Create new story</span>
      </Link>
    </Button>
  );
}
