import { Suspense } from 'react';
import { UploadHeroesContent } from '@/components/create/upload-heroes-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UploadHeroesContent />
    </Suspense>
  );
}