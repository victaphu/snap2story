"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/ui/file-upload';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { AGE_GROUPS, LENGTHS, LIMITS, PRICING, THEMES } from '@/lib/constants';
import { compressImage, getBase64Size, padBase64ToSquare } from '@/lib/image-utils';
import { usePreview } from '@/contexts/preview-context';

export function QuickCreateContent() {
  const router = useRouter();
  const { setPreviewData } = usePreview();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [theme, setTheme] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [length, setLength] = useState<number>(20);
  const [styleKey, setStyleKey] = useState<'anime'|'comic-book'|'childrens-cartoon'>('childrens-cartoon');
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImageUrl, setTitleImageUrl] = useState<string>('');
  const [heroName, setHeroName] = useState<string>('');
  const [friendName, setFriendName] = useState<string>('');
  const [originalImageBase64, setOriginalImageBase64] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [heroAnalysis, setHeroAnalysis] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Upload, 2: Name & Theme, 3: Age & Length, 4: Preview

  useEffect(() => {
    // Restore saved state once (on mount)
    let restoredTheme: string | null = null;
    let restoredAge: string | null = null;
    try {
      const raw = sessionStorage.getItem('quick_create_state');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.theme) { setTheme(s.theme); restoredTheme = s.theme; }
        if (s.age) { setAge(s.age); restoredAge = s.age; }
        if (typeof s.length === 'number') setLength(s.length);
        if (s.styleKey) setStyleKey(s.styleKey);
        if (s.heroName) setHeroName(s.heroName);
        if (s.friendName) setFriendName(s.friendName);
        if (s.originalImageBase64) {
          setOriginalImageBase64(s.originalImageBase64);
          setTitleImageUrl(s.originalImageBase64); // data URL for preview
        }
        if (typeof s.currentStep === 'number') setCurrentStep(s.currentStep);
      }
    } catch {}

    // Defaults only if not restored
    if (!restoredTheme && THEMES.length > 0) setTheme(THEMES[0].slug);
    if (!restoredAge && AGE_GROUPS.length > 0) setAge(AGE_GROUPS[3].id); // 5–6 as default
  }, []);

  // Persist state so Back from preview returns user inputs
  useEffect(() => {
    const state = {
      theme,
      age,
      length,
      styleKey,
      heroName,
      friendName,
      originalImageBase64,
      currentStep,
    };
    try { sessionStorage.setItem('quick_create_state', JSON.stringify(state)); } catch {}
  }, [theme, age, length, styleKey, heroName, friendName, originalImageBase64, currentStep]);

  const handleImageUpload = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];
    setTitleImage(file);
    setTitleImageUrl(URL.createObjectURL(file));

    toast.info('Compressing image...');
    try {
      let compressed = await compressImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        format: 'image/jpeg',
      });
      try { compressed = await padBase64ToSquare(compressed, 512, '#ffffff', 'image/jpeg', 0.9); } catch {}
      setOriginalImageBase64(compressed);
      const size = getBase64Size(compressed);
      toast.success(`Compressed to ${size.mb.toFixed(2)}MB`);
      // Defer analysis until final confirmation; user must click Next
    } catch (e) {
      toast.error('Image compression failed');
      console.error(e);
    }
  };

  const generatePreview = async () => {
    if (!theme) return toast.error('Please choose a theme');
    if (!age) return toast.error('Please choose an age group');
    if (!length) return toast.error('Please choose a length');
    if (!titleImage && !titleImageUrl) return toast.error('Please upload a hero photo');
    if (!heroName.trim()) return toast.error('Please enter a hero name');

    setIsGenerating(true);
    try {
      // Use existing analysis if available, otherwise try to analyze quickly
      let analysisToUse = heroAnalysis;
      if (!analysisToUse) {
        setIsAnalyzing(true);
        const formData = new FormData();
        if (originalImageBase64) formData.append('compressedBase64', originalImageBase64);
        else if (titleImage) formData.append('image', titleImage);
        const analysisRes = await fetch('/api/analyze-hero', { method: 'POST', body: formData });
        if (!analysisRes.ok) throw new Error('Analysis failed');
        const analysisJson = await analysisRes.json();
        analysisToUse = analysisJson.analysis;
        setHeroAnalysis(analysisToUse);
        setIsAnalyzing(false);
      }

      toast.info('Generating your cover preview...');

      // Generate cover preview
      const genRes = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroName,
          themeId: theme,
          heroAnalysis: analysisToUse,
          originalImageBase64: originalImageBase64,
          ageGroup: age,
          length,
          styleKey,
        }),
      });
      console.log(genRes);
      if (!genRes.ok) throw new Error('Preview generation failed');
      const preview = await genRes.json();

      // Add selections to preview context (age, length)
      setPreviewData({
        ...preview,
        storyTemplate: preview.storyTemplate,
        createdAt: preview.createdAt,
      });

      // Persist images and placeholders for downstream steps (build/checkout)
      try {
        sessionStorage.setItem('preview_images', JSON.stringify({
          coverImage: preview.coverImage,
          originalImage: preview.originalImage,
          storyImages: preview.storyImages || [],
        }));
        const phRaw = sessionStorage.getItem('placeholder_values');
        const ph = phRaw ? JSON.parse(phRaw) : {};
        sessionStorage.setItem('placeholder_values', JSON.stringify({ ...ph, heroName }));
      } catch {}

      // Ensure returning to step 3 when going back from preview
      try {
        sessionStorage.setItem('quick_create_state', JSON.stringify({
          theme,
          age,
          length,
          styleKey,
          heroName,
          friendName,
          originalImageBase64,
          currentStep: 3,
        }));
      } catch {}

      const sp = new URLSearchParams({
        mode: 'quick',
        heroName: preview.heroName,
        themeId: preview.themeId,
        title: preview.title,
        age,
        length: String(length),
        style: styleKey,
      });
      router.push(`/create/preview?${sp.toString()}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to create preview. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Quick Create</h1>
        <p className="text-muted-foreground">Upload → Name & Theme → Age & Length → Preview</p>
        <p className="text-xs text-muted-foreground">3 quick steps. We’ll guide you and you can change things later.</p>
      </div>

      {/* Simple inline stepper */}
      <div className="flex items-center justify-center gap-3">
        {[1,2,3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${currentStep>=step? 'bg-primary text-primary-foreground':'bg-muted text-muted-foreground'}`}>{currentStep>step? '✓': step}</div>
            {step<3 && <div className={`w-16 h-px mx-3 ${currentStep>step? 'bg-primary':'bg-border'}`}></div>}
          </div>
        ))}
      </div>

      {/* Hidden file input always present for Replace */}
      <input
        ref={fileInputRef}
        id="quick-file-input"
        type="file"
        accept="image/*"
        hidden
        onChange={(e)=>{ const f=e.target.files; if (f) handleImageUpload(Array.from(f)); }}
      />

      {/* Step 1: Upload Photo */}
      {currentStep === 1 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <Label>Hero Photo</Label>
            <p className="text-xs text-muted-foreground">Tip: Choose a clear, well-lit photo of the hero’s face. We only use this to personalize your book.</p>
            {titleImageUrl ? (
              <div className="space-y-3">
                <div className="aspect-[4/3] overflow-hidden rounded bg-muted">
                  <Image src={titleImageUrl} alt="Hero" width={480} height={360} className="w-full h-full object-cover" />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ''; fileInputRef.current.click(); } }}
                  >
                    Replace
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setTitleImage(null); setTitleImageUrl(''); setOriginalImageBase64(''); setHeroAnalysis(null); }}>Remove</Button>
                </div>
              </div>
            ) : (
              <>
                <FileUpload onFileSelect={handleImageUpload} maxFiles={1} maxSize={LIMITS.MAX_IMAGE_SIZE} accept={{ 'image/*': ['.png','.jpg','.jpeg'] }} />
                <div className="text-xs text-muted-foreground">Supported: JPG/PNG up to {(LIMITS.MAX_IMAGE_SIZE/(1024*1024)).toFixed(0)}MB.</div>
              </>
            )}

            <div className="flex justify-end">
              <Button onClick={() => setCurrentStep(2)} disabled={!titleImageUrl}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Name & Theme */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {titleImageUrl && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-14 h-14 rounded overflow-hidden border">
                <Image src={titleImageUrl} alt="Selected photo" width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div>Selected photo</div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <Label>Hero Name *</Label>
                <Input value={heroName} onChange={(e)=>setHeroName(e.target.value)} placeholder="e.g., Michael" className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">This is the main character’s name. You can change it later.</p>
                {heroAnalysis?.suggestedName && (
                  <p className="text-xs text-muted-foreground mt-1">Suggestion based on photo: “{heroAnalysis.suggestedName}”</p>
                )}
              </div>
              <div>
                <Label>Friend/Pet (optional)</Label>
                <Input value={friendName} onChange={(e)=>setFriendName(e.target.value)} placeholder="e.g., Jack or Buddy" className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">Add a companion to appear in the story (optional).</p>
              </div>

              {/* Analysis runs after confirmation; no AI notes yet */}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>Back</Button>
                <Button onClick={() => setCurrentStep(3)} disabled={!heroName.trim()}>Next</Button>
              </div>
            </CardContent>
          </Card>

          {/* Theme selection */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <Label>Choose a Theme</Label>
              <p className="text-xs text-muted-foreground">The theme sets the mood and scenes for your book.</p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Story theme">
                {THEMES.map(t => {
                  const selected = theme === t.slug;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      key={t.id}
                      onClick={() => setTheme(t.slug)}
                      className={`relative border rounded-md p-3 text-left hover:shadow-sm transition-colors ${selected ? 'border-primary ring-2 ring-primary/30 bg-primary/5' : 'hover:bg-muted/30'}`}
                    >
                      <input type="radio" name="theme" value={t.slug} checked={selected} onChange={()=>setTheme(t.slug)} className="sr-only" />
                      {selected && (
                        <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded" />
                        <div>
                          <div className="font-medium text-sm">{t.name}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{THEMES.find(x=>x.slug===theme)?.name || 'None'}</span>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* Step 3: Age & Length + Generate */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {titleImageUrl && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="w-14 h-14 rounded overflow-hidden border">
                <Image src={titleImageUrl} alt="Selected photo" width={56} height={56} className="w-full h-full object-cover" />
              </div>
              <div>Selected photo</div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Age */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Age Group</Label>
                <p className="text-xs text-muted-foreground">We tailor language and pacing for this age.</p>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setAge(a.id)}
                      className={`px-3 py-2 border rounded-full text-sm ${age===a.id?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted'}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Length */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Length</Label>
                <p className="text-xs text-muted-foreground">Select total pages. Longer books include more chapters.</p>
                <div className="flex gap-2">
                  {LENGTHS.map(len => (
                    <button
                      key={len}
                      onClick={() => setLength(len)}
                      className={`px-4 py-2 border rounded-md text-sm ${length===len?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted'}`}
                    >
                      {len} pages
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Free tier: 10‑page watermarked PDF • Full digital: ${PRICING.DIGITAL_FULL}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>Summary</Label>
                <div className="text-sm text-muted-foreground">
                  <div>Hero: <span className="text-foreground font-medium">{heroName}</span></div>
                  <div>Theme: <span className="text-foreground font-medium">{THEMES.find(t=>t.slug===theme)?.name || theme}</span></div>
                  <div>Age: <span className="text-foreground font-medium">{AGE_GROUPS.find(a=>a.id===age)?.label || age}</span></div>
                  <div>Length: <span className="text-foreground font-medium">{length} pages</span></div>
                </div>
                <p className="text-xs text-muted-foreground">Click “Continue to Preview” to see your personalized cover.</p>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setCurrentStep(2)}>Back</Button>
                  <Button className="" size="default" onClick={generatePreview} disabled={isGenerating || isAnalyzing}>
                    {isGenerating ? (
                      <>
                        <LoadingSpinner className="h-4 w-4 mr-2" />
                        {isAnalyzing? 'Analyzing photo...' : 'Creating preview...'}
                      </>
                    ) : 'Continue to Preview'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
