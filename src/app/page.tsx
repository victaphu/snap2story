import { Suspense } from 'react';
import { HomeContent } from '@/components/home/home-content';
import { LoadingPage } from '@/components/ui/loading-spinner';

export default function Home() {
  return (
    <Suspense fallback={<LoadingPage message="Loading home page..." />}>
      <HomeContent />
    </Suspense>
  );
}
