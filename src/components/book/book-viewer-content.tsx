'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, Share2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

// Mock story data - replace with real API call
const mockStory = {
  id: '1',
  title: 'Adventures with Max',
  status: 'ready',
  pages: [
    {
      id: '1',
      pageNum: 0,
      pageType: 'front_cover',
      imageUrl: '/api/placeholder/400/500',
      text: 'Adventures with Max'
    },
    {
      id: '2', 
      pageNum: 1,
      pageType: 'image',
      imageUrl: '/api/placeholder/400/300',
      text: null
    },
    {
      id: '3',
      pageNum: 2, 
      pageType: 'text',
      imageUrl: null,
      text: 'Once upon a time, there was a brave little boy named Max who loved to explore the world around him.'
    },
    {
      id: '4',
      pageNum: 3,
      pageType: 'image', 
      imageUrl: '/api/placeholder/400/300',
      text: null
    },
    {
      id: '5',
      pageNum: 4,
      pageType: 'text',
      imageUrl: null,
      text: 'Max discovered a magical forest where the trees sparkled with golden leaves and friendly animals lived in harmony.'
    },
    {
      id: '6',
      pageNum: 21,
      pageType: 'back_cover',
      imageUrl: '/api/placeholder/400/500',
      text: 'The End'
    }
  ]
};

export function BookViewerContent() {
  const params = useParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);
  const [story, setStory] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStory = async () => {
      setIsLoading(true);
      try {
        // TODO: Replace with real API call
        // const response = await fetch(`/api/stories/${params.id}`);
        // const data = await response.json();
        
        // For now, use mock data
        setTimeout(() => {
          setStory(mockStory);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error loading story:', error);
        setIsLoading(false);
      }
    };

    if (params.id) {
      loadStory();
    }
  }, [params.id]);

  const nextPage = () => {
    if (story && currentPage < story.pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Story Not Found</h1>
          <p className="text-muted-foreground">The story you&apos;re looking for doesn&apos;t exist.</p>
          <Button asChild>
            <Link href="/library">Back to Library</Link>
          </Button>
        </div>
      </div>
    );
  }

  const currentPageData = story.pages[currentPage];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/library">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Library
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold">{story.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    Page {currentPage + 1} of {story.pages.length}
                  </Badge>
                  <Badge variant="outline">
                    {currentPageData?.pageType?.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Book Viewer */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Content */}
          <Card className="mb-6">
            <CardContent className="p-0">
              <div className="aspect-[4/3] bg-gradient-to-br from-cream to-white rounded-lg overflow-hidden">
                {currentPageData?.imageUrl && (
                  <div className="relative w-full h-full">
                    <Image
                      src={currentPageData.imageUrl}
                      alt={`Page ${currentPage + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
                
                {currentPageData?.text && (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center space-y-4 max-w-2xl">
                      <BookOpen className="h-12 w-12 text-primary mx-auto" />
                      <p className="text-lg leading-relaxed font-medium text-foreground">
                        {currentPageData.text}
                      </p>
                    </div>
                  </div>
                )}
                
                {!currentPageData?.imageUrl && !currentPageData?.text && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4" />
                      <p>Page content loading...</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              onClick={previousPage}
              disabled={currentPage === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {story.pages.length}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              onClick={nextPage}
              disabled={currentPage === story.pages.length - 1}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Page Thumbnails */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">All Pages</h3>
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {story.pages.map((page: any, index: number) => (
                <button
                  key={page.id}
                  onClick={() => goToPage(index)}
                  className={`
                    aspect-[3/4] rounded border-2 transition-all hover:border-primary/50
                    ${currentPage === index ? 'border-primary ring-2 ring-primary/20' : 'border-border'}
                  `}
                >
                  {page.imageUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={page.imageUrl}
                        alt={`Page ${index + 1}`}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}