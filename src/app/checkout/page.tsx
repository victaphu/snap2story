import { Suspense } from 'react';
import { CheckoutContent } from '@/components/checkout/checkout-content';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}> 
      <CheckoutContent />
    </Suspense>
  );
}

