'use client';

import { ProgressRing } from './progress-ring';
import { BOOK_STRUCTURE } from '@/lib/constants';

interface BookProgressProps {
  currentPage: number;
  totalPages?: number;
  size?: number;
  className?: string;
  showBreakdown?: boolean;
}

export function BookProgress({
  currentPage,
  totalPages = BOOK_STRUCTURE.CONTENT_PAGES,
  size = 120,
  className,
  showBreakdown = false,
}: BookProgressProps) {
  return (
    <div className="flex flex-col items-center space-y-4">
      <ProgressRing
        progress={currentPage}
        total={totalPages}
        size={size}
        className={className}
      />
      
      {showBreakdown && (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Creating your personalized book...
          </p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-medium">{BOOK_STRUCTURE.IMAGE_PAGES}</span>
              <br />
              <span className="text-muted-foreground">Images</span>
            </div>
            <div>
              <span className="font-medium">{BOOK_STRUCTURE.TEXT_PAGES}</span>
              <br />
              <span className="text-muted-foreground">Text pages</span>
            </div>
            <div>
              <span className="font-medium">2</span>
              <br />
              <span className="text-muted-foreground">Covers</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated time: ~2-3 minutes
          </p>
        </div>
      )}
    </div>
  );
}