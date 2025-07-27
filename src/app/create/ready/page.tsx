import { Suspense } from 'react';
import { BookReadyContent } from '@/components/create/book-ready-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function BookReadyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookReadyContent />
    </Suspense>
  );
}