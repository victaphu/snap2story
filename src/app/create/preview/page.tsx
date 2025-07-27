import { Suspense } from 'react';
import { PreviewContent } from '@/components/create/preview-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function PreviewPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PreviewContent />
    </Suspense>
  );
}