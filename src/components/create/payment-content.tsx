'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, CreditCard, Shield, Sparkles, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

export function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sampleId = searchParams.get('sampleId');
  const mode = searchParams.get('mode') || 'ai-assisted';
  const theme = searchParams.get('theme');
  
  const [sample, setSample] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadSample = () => {
      try {
        const savedSample = sessionStorage.getItem('story_sample');
        if (savedSample) {
          const sampleData = JSON.parse(savedSample);
          setSample(sampleData);
        } else {
          toast.error('Sample not found');
          router.push('/create/title-page');
        }
      } catch (error) {
        toast.error('Failed to load sample');
        router.push('/create/title-page');
      } finally {
        setIsLoading(false);
      }
    };

    loadSample();
  }, [sampleId, router]);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // TODO: Integrate with Stripe
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create story draft record
      const storyDraft = {
        id: `story-${Date.now()}`,
        title: sample.title,
        mode,
        theme: sample.theme,
        originalImage: sessionStorage.getItem('title_image'),
        prompt: sample.prompt,
        sampleData: sample,
        status: 'paid',
        paymentAmount: 5,
        paymentDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      // Store draft
      const existingDrafts = JSON.parse(sessionStorage.getItem('story_drafts') || '[]');
      sessionStorage.setItem('story_drafts', JSON.stringify([...existingDrafts, storyDraft]));
      sessionStorage.setItem('current_story_draft', JSON.stringify(storyDraft));
      
      toast.success('Payment successful! Creating your story...');
      
      // Redirect to appropriate creation flow
      if (mode === 'custom') {
        router.push('/create/custom?paid=true');
      } else {
        router.push('/create/upload?paid=true');
      }
    } catch (error) {
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!sample) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Sample Not Found</h1>
        <p className="text-muted-foreground">Please generate a sample first.</p>
        <Button asChild>
          <Link href="/create/title-page">Generate Sample</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={mode === 'ai-assisted' && theme ? `/create/upload-photo?mode=${mode}&theme=${theme}` : '/create/upload-photo?mode=custom'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Upload
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Complete Your Story</h1>
          <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">
            Pay $5 to unlock the full story creation experience
          </p>
        </div>
      </div>

      {/* Progress indicator - Hidden on mobile */}
      <div className="hidden sm:flex items-center justify-center space-x-4">
        {mode === 'ai-assisted' && theme ? (
          // New AI-assisted workflow
          <>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm text-primary font-medium">Theme Selected</span>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm text-primary font-medium">Photo Uploaded</span>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-primary">Pay & Create</span>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                4
              </div>
              <span className="ml-2 text-sm text-muted-foreground">Complete Book</span>
            </div>
          </>
        ) : (
          // Custom workflow
          <>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm text-primary font-medium">Upload & Describe</span>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-primary">Review & Pay</span>
            </div>
            <div className="w-16 h-px bg-border"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-sm text-muted-foreground">Create Story</span>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Sample Review */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Your Story Sample
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {sample.samplePages.slice(0, 2).map((page: any, index: number) => (
                  <div key={page.id} className="border rounded-lg p-3">
                    <div className="text-xs font-medium text-muted-foreground mb-2">
                      {page.type === 'cover' ? 'Cover' : `Page ${index}`}
                    </div>
                    <div className="aspect-[4/3] bg-gradient-to-br from-cream to-white rounded border p-3 flex flex-col text-center">
                      {page.imageUrl && (
                        <div className="flex-1 mb-2">
                          <Image 
                            src={page.imageUrl} 
                            alt="Sample"
                            width={200}
                            height={150}
                            className="w-full h-full object-contain rounded"
                          />
                        </div>
                      )}
                      {page.title && (
                        <h3 className="font-bold text-sm mb-1">{page.title}</h3>
                      )}
                      <p className="text-xs text-muted-foreground">{page.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">This is just a preview!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your full story will have {mode === 'custom' ? 'up to 10' : '20'} pages
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Story Details - Hidden on mobile */}
          <Card className="hidden sm:block">
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mode:</span>
                <Badge variant="secondary" className="capitalize">
                  {mode.replace('-', ' ')}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Theme:</span>
                <span className="capitalize">{theme || sample.selectedTheme || sample.theme || 'Custom'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated:</span>
                <span>{new Date(sample.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Payment */}
        <div className="space-y-6">
          {/* Payment Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Complete Your Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* What's Included */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm sm:text-base">What&apos;s included:</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>{mode === 'custom' ? 'Up to 10' : '20'} pages</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>AI illustrations</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:hidden">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span>Full editing</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>{mode === 'custom' ? 'Full editing control' : 'Theme customization'}</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Draft saved to your profile</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Option to order physical books</span>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold">Story Creation</span>
                  <span className="text-2xl font-bold text-primary">$5.00</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  One-time payment for full story generation. Physical books are priced separately.
                </p>
              </div>

              {/* Security Note */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <Shield className="h-4 w-4" />
                <span>Secure payment processing via Stripe</span>
              </div>

              {/* Payment Button */}
              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay $5 & Create Story
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Money Back Guarantee */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4 text-center">
              <h3 className="font-semibold text-green-800 mb-2">Money-Back Guarantee</h3>
              <p className="text-sm text-green-700">
                If you&apos;re not satisfied with your generated story, we&apos;ll refund your $5 within 24 hours.
              </p>
            </CardContent>
          </Card>

          {/* FAQ - Hidden on mobile */}
          <Card className="hidden sm:block">
            <CardHeader>
              <CardTitle className="text-lg">Questions?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Can I edit the story after payment?</p>
                <p className="text-muted-foreground">Yes! You&apos;ll have full editing capabilities once you pay.</p>
              </div>
              <div>
                <p className="font-medium">What if I don&apos;t like the result?</p>
                <p className="text-muted-foreground">We offer a full refund within 24 hours if you&apos;re not satisfied.</p>
              </div>
              <div>
                <p className="font-medium">How long does generation take?</p>
                <p className="text-muted-foreground">Story generation typically takes 2-5 minutes after payment.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}