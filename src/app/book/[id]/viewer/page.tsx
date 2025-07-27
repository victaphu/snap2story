import { Suspense } from 'react';
import { BookViewerContent } from '@/components/book/book-viewer-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function BookViewerPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookViewerContent />
    </Suspense>
  );
}