'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Download, Eye, Edit, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

interface PreviewPage {
  id: string;
  pageNumber: number;
  type: 'cover' | 'content';
  title?: string;
  text: string;
  imageUrl?: string;
}

export function CustomPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get('storyId');
  
  const [story, setStory] = useState<any>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load story data
    const loadStory = () => {
      try {
        // In a real app, this would fetch from Supabase using storyId
        const savedStory = sessionStorage.getItem('custom_story');
        if (savedStory) {
          const storyData = JSON.parse(savedStory);
          setStory(storyData);
        } else {
          toast.error('Story not found');
          router.push('/create/custom');
        }
      } catch (error) {
        toast.error('Failed to load story');
        router.push('/create/custom');
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, router]);

  const handleFinishStory = () => {
    // Navigate to purchase options
    router.push(`/create/ready?storyId=${storyId || 'custom'}&type=custom`);
  };

  const handleEditStory = () => {
    router.push('/create/custom');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!story) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Story Not Found</h1>
        <p className="text-muted-foreground">The story you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/create/custom">Create New Story</Link>
        </Button>
      </div>
    );
  }

  const pages = story.pages || [];
  const currentPage = pages[currentPageIndex];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/create/custom">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Editor
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{story.title}</h1>
          <p className="text-muted-foreground">
            Preview your custom story • {pages.length} pages
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditStory}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Story
          </Button>
          <Button onClick={handleFinishStory}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Finish & Order
          </Button>
        </div>
      </div>

      {/* Page Preview */}
      <Card>
        <CardContent className="p-8">
          {currentPage ? (
            <div className="aspect-[4/3] bg-gradient-to-br from-cream to-white rounded-lg border-2 border-muted p-8 flex flex-col">
              {currentPage.imageUrl && (
                <div className="flex-1 mb-6">
                  <Image 
                    src={currentPage.imageUrl} 
                    alt="Page content"
                    width={600}
                    height={400}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
              )}
              
              <div className={`text-center space-y-2 ${!currentPage.imageUrl ? 'flex-1 flex flex-col justify-center' : ''}`}>
                {currentPage.title && (
                  <h2 className="text-3xl font-bold text-foreground">{currentPage.title}</h2>
                )}
                {currentPage.text && (
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    {currentPage.text}
                  </p>
                )}
                {!currentPage.title && !currentPage.text && (
                  <p className="text-muted-foreground italic">Empty page</p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-[4/3] bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">No page content</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
          disabled={currentPageIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous Page
        </Button>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          
          {/* Page indicators */}
          <div className="flex gap-1">
            {pages.map((_: any, index: number) => (
              <button
                key={index}
                onClick={() => setCurrentPageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentPageIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
        
        <Button
          variant="outline"
          onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
          disabled={currentPageIndex === pages.length - 1}
        >
          Next Page
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Story Info */}
      <Card>
        <CardHeader>
          <CardTitle>Story Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{pages.length}</div>
            <div className="text-sm text-muted-foreground">Total Pages</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {pages.filter((p: any) => p.imageUrl).length}
            </div>
            <div className="text-sm text-muted-foreground">Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">Custom</div>
            <div className="text-sm text-muted-foreground">Story Type</div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleEditStory}>
          <Edit className="h-4 w-4 mr-2" />
          Continue Editing
        </Button>
        <Button onClick={handleFinishStory} size="lg">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Finish Story & Order Book
        </Button>
      </div>
    </div>
  );
}