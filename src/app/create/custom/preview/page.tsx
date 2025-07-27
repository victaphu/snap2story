import { Suspense } from 'react';
import { CustomPreviewContent } from '@/components/create/custom-preview-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CustomPreviewPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CustomPreviewContent />
    </Suspense>
  );
}