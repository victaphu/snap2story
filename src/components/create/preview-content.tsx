"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Sparkles, Info, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProgressSteps } from './progress-steps';
import { usePreview } from '@/contexts/preview-context';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/services/supabase-client';

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
  imageInspiration?: string;
  pages: PreviewPage[];
  heroName: string;
  theme: string;
  createdAt: string;
}

export function PreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { previewData: contextPreviewData } = usePreview();
  const mode = searchParams.get('mode') || 'ai-assisted';
  const theme = searchParams.get('theme');

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'free' | '20' | '30' | null>(null);
  const [aiDetailsOpen, setAiDetailsOpen] = useState(false);
  const [dbPages, setDbPages] = useState<{ pageNumber: number; text: string; imageDescription: string }[]>([]);

  useEffect(() => {
    // Prefer context data (contains images and analysis)
    if (contextPreviewData) {
      setPreviewData(contextPreviewData as any);
      setIsLoading(false);
      return;
    }
    // Fallback from URL params for a minimal preview state
    const heroName = searchParams.get('heroName');
    const themeId = searchParams.get('themeId');
    const title = searchParams.get('title');
    if (heroName && themeId && title) {
      setPreviewData({
        id: `preview-${Date.now()}`,
        title,
        themeId,
        coverImage: '',
        originalImage: '',
        storyTemplate: { id: themeId, theme: theme || 'Adventure', title, pages: [] },
        pages: [{ id: 'title-page', type: 'title', title, text: `A magical story featuring ${heroName}!`, imageUrl: '' }],
        heroName,
        theme: theme || 'Adventure',
        createdAt: new Date().toISOString(),
      } as any);
    } else {
      toast.error('Preview data missing - redirecting to create page');
      router.push('/create');
    }
    setIsLoading(false);
  }, [contextPreviewData, searchParams, theme, router]);

  // Fetch outline pages from Supabase
  useEffect(() => {
    const fetchPages = async () => {
      const themeSlug = searchParams.get('theme');
      const ageGroup = searchParams.get('age') || '5-6';
      if (!themeSlug) return;
      const map: Record<string, string> = {
        adventure: 'adventure_flexible_multiage',
        friendship: 'friendship_flexible_multiage',
        family: 'family_flexible_multiage',
        dreams: 'dreams_flexible_multiage',
      };
      const storyId = map[themeSlug];
      if (!storyId) return;
      const ageNum = parseInt((ageGroup.split('-')[0] || '5'), 10);
      const { data, error } = await supabase.rpc('get_story_pages_for_age', { p_story_id: storyId, p_age: ageNum });
      if (!error && Array.isArray(data)) {
        setDbPages(
          data.map((r: any) => ({
            pageNumber: Number(r.page_number),
            text: String(r.text || ''),
            imageDescription: String(r.image_description || ''),
          }))
        );
      }
    };
    fetchPages();
  }, [searchParams]);

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
        <p className="text-muted-foreground">The preview you&apos;re looking for could not be found.</p>
        <Button asChild>
          <Link href="/create">Go Back to Create</Link>
        </Button>
      </div>
    );
  }

  console.log(previewData);
  const isMockPreview = typeof previewData.imageInspiration === 'string' && previewData.imageInspiration.toLowerCase().includes('mocked');
  const isMockAnalysis = (previewData as any)?.heroAnalysis?.mockedAnalysis === true;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Progress Steps */}
      <ProgressSteps 
        mode={mode} 
        currentStep={2} 
      />

      {/* Mock mode indicator */}
      {(isMockPreview || isMockAnalysis) && (
        <div className="flex items-center justify-center">
          <div className="w-full md:w-auto bg-amber-50 border border-amber-200 text-amber-900 rounded-md px-3 py-2 text-sm flex items-center gap-2">
            <Badge variant="secondary" className="bg-amber-200 text-amber-900 border-amber-300">Mock Mode</Badge>
            <span>
              {isMockPreview ? 'Preview image mocked' : ''}
              {isMockPreview && isMockAnalysis ? ' • ' : ''}
              {isMockAnalysis ? 'Analysis mocked' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { try { 
              const raw = sessionStorage.getItem('quick_create_state');
              const base = raw ? JSON.parse(raw) : {};
              sessionStorage.setItem('quick_create_state', JSON.stringify({ ...base, currentStep: 3 }));
            } catch {} ; router.push('/create/quick'); }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Edit
          </Button>
        </div>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Your Preview</h1>
        <div className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-3">
          <span>Here&apos;s your preview.</span>
          <Dialog open={aiDetailsOpen} onOpenChange={setAiDetailsOpen}>
            <DialogTrigger asChild>
              <button className="text-primary underline inline-flex items-center gap-1">
                <Info className="h-4 w-4" /> How we personalize with AI
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>How we use your photo</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                {previewData.heroAnalysis ? (
                  <div className="space-y-1">
                    <div><span className="font-medium">Age:</span> {previewData.heroAnalysis.age}</div>
                    <div><span className="font-medium">Hair:</span> {previewData.heroAnalysis.hairColor} • <span className="font-medium">Outfit:</span> {previewData.heroAnalysis.clothing}</div>
                    <div className="italic">“{previewData.heroAnalysis.description}”</div>
                    <div className="text-xs text-muted-foreground">Confidence: {previewData.heroAnalysis.confidence}/10</div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">Analysis will appear here after generation.</div>
                )}
                {previewData.imageInspiration && (
                  <div className="space-y-1">
                    <div className="font-medium">Cover Inspiration</div>
                    <p>{previewData.imageInspiration}</p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  We only use your photo to personalize images and story content for this book.
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                        &ldquo;{previewData.title}&rdquo;
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        AI-personalized for {previewData.heroName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-center text-muted-foreground">
                {previewData.coverImage ? `AI-generated with book title &ldquo;${previewData.title}&rdquo;` : '🎉 Your personalized cover has been created!'}
              </p>
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
              <p className="text-xs text-center text-muted-foreground">We only use your photo to personalize your book.</p>
            </div>
          </div>
          {/* AI details moved to modal link above */}
        </CardContent>
      </Card>
      {/* Selection options + story outline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Story Outline (first pages)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Story Outline:</h4>
              <div className="bg-muted rounded-lg p-3 max-h-56 overflow-y-auto">
                {(dbPages.length ? dbPages : previewData.storyTemplate.pages).slice(0, 3).map((page: any, index: number) => (
                  <div key={index} className="text-sm mb-2">
                    <span className="font-medium">Page {page.pageNumber}:</span> {page.text.replace(/{heroName}/g, previewData.heroName)}
                  </div>
                ))}
                <div className="text-xs text-muted-foreground italic">Full story generates after purchase.</div>
              </div>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="text-sm"><span className="font-medium">Hero:</span> {previewData.heroName}</div>
              <div className="text-sm"><span className="font-medium">Theme:</span> {previewData.theme}</div>
              <p className="text-xs text-muted-foreground">You can change details after you pick an option.</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Ready for the complete story?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[{k:'free',label:'Free sample',sub:'5 pages • 5 images • watermark'},{k:'20',label:'20-page digital book',sub:'Full story • High-res images'},{k:'30',label:'30-page digital book',sub:'Extended story • More images'}].map((opt:any)=>{
              const active = selectedOption===opt.k;
              return (
                <button key={opt.k} className={`w-full text-left border rounded p-3 hover:bg-background flex items-center justify-between ${active?'border-primary ring-1 ring-primary/30':''}`} onClick={()=>setSelectedOption(opt.k as any)}>
                  <div>
                    <div className="font-semibold">{opt.label}</div>
                    <div className="text-sm text-muted-foreground">{opt.sub}</div>
                  </div>
                  {active && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
            <Button
              className="w-full mt-2"
              disabled={!selectedOption}
              onClick={()=>{
                if (selectedOption==='free') router.push('/checkout?type=free&length=5');
                if (selectedOption==='20') router.push('/checkout?type=digital&length=20');
                if (selectedOption==='30') router.push('/checkout?type=digital&length=30');
              }}
            >
              {selectedOption ? 'Continue' : 'Choose an option to continue'}
            </Button>
            {!selectedOption && (
              <p className="text-xs text-muted-foreground text-center">Select one above to enable Continue. No payment needed for the free sample.</p>
            )}
            <div className="mt-3 bg-muted/30 border rounded p-3 text-xs text-muted-foreground">
              <p>
                After you continue, we’ll start creating your book. This can take a few minutes. 
                We’ll email you as soon as it’s ready. Thank you for using Snap2Story!
              </p>
              <p className="mt-2">
                If you need help at any time, we’re happy to assist: 
                <a href="mailto:support@storymosaic.com" className="underline text-primary">support@storymosaic.com</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
