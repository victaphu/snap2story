'use client';

import { useState, useEffect } from 'react';
import { X, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReconnectionBannerProps {
  jobId: string | null;
  onDismiss?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export function ReconnectionBanner({ 
  jobId, 
  onDismiss, 
  autoHide = true, 
  autoHideDelay = 5000 
}: ReconnectionBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (jobId) {
      setVisible(true);
      
      if (autoHide) {
        const timer = setTimeout(() => {
          setVisible(false);
          onDismiss?.();
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [jobId, autoHide, autoHideDelay, onDismiss]);

  if (!visible || !jobId) return null;

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wifi className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-800 font-medium">
              Reconnected to your ongoing image generation
            </span>
            <span className="text-xs text-blue-600 font-mono bg-blue-100 px-2 py-0.5 rounded">
              {jobId.slice(-8)}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setVisible(false);
            onDismiss?.();
          }}
          className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-100"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}