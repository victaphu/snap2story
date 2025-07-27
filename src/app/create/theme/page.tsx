import { Suspense } from 'react';
import { ChooseThemeContent } from '@/components/create/choose-theme-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ThemePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ChooseThemeContent />
    </Suspense>
  );
}