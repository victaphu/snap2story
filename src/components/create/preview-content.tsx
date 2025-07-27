'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CreditCard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProgressSteps } from './progress-steps';
import { usePreview } from '@/contexts/preview-context';

interface PreviewPage {
  id: string;
  type: 'title' | 'cover' | 'content';
  title?: string;
  text: string;
  imageUrl: string;
}

interface StoryTemplate {
  id: string;
  theme: string;
  title: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imageDescription: string;
  }>;
}

interface HeroAnalysis {
  age: string;
  hairColor: string;
  eyeColor: string;
  complexion: string;
  clothing: string;
  expression: string;
  distinctiveFeatures: string;
  suggestedName: string;
  confidence: number;
  description: string;
}

interface PreviewData {
  id: string;
  title: string;
  themeId: string;
  coverImage: string;
  originalImage: string;
  storyTemplate: StoryTemplate;
  heroAnalysis?: HeroAnalysis;
  pages: PreviewPage[];
  heroName: string;
  theme: string;
  createdAt: string;
}

export function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { previewData: contextPreviewData } = usePreview();
  const previewId = searchParams.get('previewId');
  const mode = searchParams.get('mode') || 'ai-assisted';
  const theme = searchParams.get('theme');
  
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First try to get data from context (from memory)
    if (contextPreviewData) {
      setPreviewData(contextPreviewData as any);
      setIsLoading(false);
      return;
    }
    
    // Fallback: Get data from URL parameters (no images)
    const heroName = searchParams.get('heroName');
    const themeId = searchParams.get('themeId');
    const title = searchParams.get('title');
    
    if (heroName && themeId && title) {
      // Create basic preview data from URL parameters - no images stored
      const basicPreviewData: PreviewData = {
        id: `preview-${Date.now()}`,
        title: title,
        themeId: themeId,
        coverImage: '', // Will show placeholder
        originalImage: '',
        storyTemplate: { id: themeId, theme: theme || 'Adventure', title: title, pages: [] },
        heroAnalysis: undefined,
        pages: [{
          id: 'title-page',
          type: 'title',
          title: title,
          text: `A magical story featuring ${heroName}!`,
          imageUrl: '', // Will show placeholder
        }],
        heroName: heroName,
        theme: theme || 'Adventure',
        createdAt: new Date().toISOString(),
      };
      
      setPreviewData(basicPreviewData);
    } else {
      toast.error('Preview data missing - redirecting to create page');
      router.push('/create');
    }
    
    setIsLoading(false);
  }, [contextPreviewData, searchParams, theme, router]);

  const handlePayAndContinue = () => {
    // Navigate to payment with preview data passed via URL parameters
    if (previewData) {
      const paymentParams = new URLSearchParams({
        sampleId: previewData.id,
        mode: mode,
        heroName: previewData.heroName,
        themeId: previewData.themeId,
        title: previewData.title
      });
      
      if (theme) paymentParams.set('theme', theme);
      
      router.push(`/create/payment?${paymentParams.toString()}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Preview Not Found</h1>
        <p className="text-muted-foreground">The preview you're looking for could not be found.</p>
        <Button asChild>
          <Link href="/create">Go Back to Create</Link>
        </Button>
      </div>
    );
  }

  const currentPageData = previewData.pages[currentPage];

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Progress Steps */}
      <ProgressSteps 
        mode={mode} 
        currentStep={2} 
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={`/create/upload-photo?mode=${mode}${theme ? `&theme=${theme}` : ''}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Edit
          </Link>
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
          Preview: {previewData.title}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Here's your free preview! Pay $5 to generate the complete 20-page story.
        </p>
      </div>

      {/* Generated Title Page - Full Width */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">
            🎉 Your AI-Generated Book Cover!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Generated Cover */}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-center">✨ Generated Book Cover</h3>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden max-w-md mx-auto">
                {previewData.coverImage ? (
                  <Image
                    src={previewData.coverImage}
                    alt={previewData.title}
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-100/50 flex items-center justify-center border-2 border-dashed border-primary/30">
                    <div className="text-center p-6">
                      <div className="text-4xl mb-2">📚</div>
                      <p className="font-semibold text-primary">Cover Generated!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{previewData.title}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        AI-personalized for {previewData.heroName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {previewData.coverImage ? `AI-generated with book title "${previewData.title}"` : '🎉 Your personalized cover has been created!'}
              </p>
              
              {/* Show Hero Analysis if available */}
              {previewData.heroAnalysis && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-2">
                  <h4 className="text-sm font-semibold text-primary text-center mb-2">✨ Based on AI Analysis</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="font-medium">Age:</span> {previewData.heroAnalysis.age}</div>
                    <div><span className="font-medium">Hair:</span> {previewData.heroAnalysis.hairColor}</div>
                    <div><span className="font-medium">Outfit:</span> {previewData.heroAnalysis.clothing}</div>
                    <div><span className="font-medium">Expression:</span> {previewData.heroAnalysis.expression}</div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Cover matches your photo: {previewData.heroAnalysis.description}
                  </p>
                </div>
              )}
            </div>

            {/* Original Image */}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-semibold text-center">📸 Your Hero Photo</h3>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden max-w-md mx-auto">
                {previewData.originalImage ? (
                  <Image
                    src={previewData.originalImage}
                    alt="Original uploaded photo"
                    width={400}
                    height={400}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-dashed border-blue-300">
                    <div className="text-center p-6">
                      <div className="text-4xl mb-2">👶</div>
                      <p className="font-semibold text-blue-700">Photo Uploaded!</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Hero: {previewData.heroName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Used for AI personalization
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {previewData.originalImage ? 'Your uploaded hero photo' : '✨ Analyzed and ready for your story!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Ready for the Complete Story?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                This free preview shows you the quality! Your complete personalized story will include:
              </p>
              <div className="bg-background rounded-lg p-4 space-y-2">
                <h4 className="font-semibold">Complete {previewData.title} Story:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• 20 beautifully illustrated pages</li>
                  <li>• {previewData.storyTemplate.pages.length} unique story chapters</li>
                  <li>• AI-generated images featuring {previewData.heroName}</li>
                  <li>• Professional front and back covers</li>
                  <li>• High-resolution images perfect for printing</li>
                  <li>• PDF download + printing options</li>
                </ul>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Complete Story Book</span>
                <span className="text-3xl font-bold text-primary">$5.00</span>
              </div>
              
              <Button 
                onClick={handlePayAndContinue}
                className="w-full"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay $5 & Generate Full Story
              </Button>
              
              <p className="text-xs text-center text-muted-foreground mt-2">
                One-time payment • Instant generation • No subscription
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Story Preview */}
        <Card>
          <CardHeader>
            <CardTitle>{previewData.theme} Story Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Story Outline:</h4>
              <div className="bg-muted rounded-lg p-3 max-h-60 overflow-y-auto">
                {previewData.storyTemplate.pages.slice(0, 5).map((page, index) => (
                  <div key={index} className="text-sm mb-2">
                    <span className="font-medium">Page {page.pageNumber}:</span> {page.text.replace(/{heroName}/g, previewData.heroName)}
                  </div>
                ))}
                {previewData.storyTemplate.pages.length > 5 && (
                  <div className="text-sm text-muted-foreground italic">
                    ...and {previewData.storyTemplate.pages.length - 5} more exciting pages!
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div>
                <span className="font-medium">Hero:</span> {previewData.heroName}
              </div>
              <div>
                <span className="font-medium">Theme:</span> {previewData.theme}
              </div>
              <div>
                <span className="font-medium">Total Pages:</span> 20 (10 images + 10 text)
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}