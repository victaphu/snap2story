'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h2 className="text-2xl font-semibold mb-4">Something went wrong!</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        An error occurred while loading this page.
      </p>
      <Button onClick={reset}>
        Try again
      </Button>
    </div>
  );
}