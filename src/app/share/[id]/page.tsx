import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

function ShareInner({ params, searchParams }: any) {
  const { id } = params;
  const ref = searchParams?.ref;
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Story Preview</h1>
        {ref && <p className="text-xs text-muted-foreground">Referral applied: {ref}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sample spreads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-[4/3] bg-muted rounded" />
            <div className="aspect-[4/3] bg-muted rounded" />
            <div className="aspect-[4/3] bg-muted rounded" />
            <div className="aspect-[4/3] bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SharePage(props: any) {
  return (
    <Suspense fallback={<LoadingSpinner />}> 
      <ShareInner {...props} />
    </Suspense>
  );
}

