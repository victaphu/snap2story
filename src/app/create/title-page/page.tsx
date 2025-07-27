import { Suspense } from 'react';
import { TitlePageContent } from '@/components/create/title-page-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TitlePagePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TitlePageContent />
    </Suspense>
  );
}