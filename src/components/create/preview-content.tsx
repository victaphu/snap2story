"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ProgressSteps } from './progress-steps';
// No longer rely on preview-context; use URL + session
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/lib/services/supabase-client';
import { AGE_GROUPS, LENGTHS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceholdersForm } from './placeholders-form';

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
  const mode = searchParams.get('mode') || 'ai-assisted';
  const theme = searchParams.get('theme');

  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<'free' | '20' | '30' | null>(null);
  type DbPage = { pageNumber: number; text: string; imageDescription: string; kind?: string; isTitle?: boolean; isDedication?: boolean; raw?: any };
  const [dbPages, setDbPages] = useState<DbPage[]>([]);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const debounceRef = useRef<any>(null);
  const [readerOpen, setReaderOpen] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sequenceLen, setSequenceLen] = useState(0);
  const [currentPageTitle, setCurrentPageTitle] = useState<string>('');
  // Selection controls moved before any conditional returns to preserve hook order
  // Default to 10 pages when length is not provided
  const [selectedLength, setSelectedLength] = useState<number>(Number(searchParams.get('length') || 10));
  const [selectedAge, setSelectedAge] = useState<string>(searchParams.get('age') || '5-6');
  const priceLabel = useMemo(() => {
    if (selectedLength === 10) return 'Free sample';
    if (selectedLength === 20) return '$14.99';
    if (selectedLength === 30) return '$19.99';
    return '';
  }, [selectedLength]);
  

  // Simple book-like preview component
  function BookPreview({ coverImage, storyImages, pages, selectedLength, applyText, idx, onIdxChange, onMetaChange }: { coverImage: string; storyImages?: string[]; pages: { pageNumber: number; text: string }[]; selectedLength: number; applyText: (t: string)=>string; idx: number; onIdxChange: (n: number)=>void; onMetaChange?: (label: string, len: number)=>void; }) {
    // Build a fixed 10-page sample sequence regardless of selectedLength
    const sequence: Array<{ type: 'image'|'text'; src?: string; text?: string; title?: string }>= [];
    // Only consider story pages with pageNumber >= 1 for the sample
    const storySource = (pages || []).filter((p) => typeof p?.pageNumber === 'number' && p.pageNumber >= 1);
    // 1: Front cover
    sequence.push({ type: 'image', src: coverImage, title: 'Front Cover' });
    // 2: true blank page
    sequence.push({ type: 'image', src: undefined, title: 'Blank' });
    // 3: Dedication page uses the themed image background
    sequence.push({ type: 'image', src: '/page-first-003.png', title: 'Dedication' });
    // 4-7: Two story text pages interleaved with two generated images
    const pairCount = 2;
    for (let i = 0; i < pairCount; i++) {
      const p = storySource[i];
      const txt = p?.text ? applyText(p.text) : 'Sample story text';
      // story text
      sequence.push({ type: 'text', text: txt });
      // story image
      if (Array.isArray(storyImages) && storyImages[i]) {
        sequence.push({ type: 'image', src: storyImages[i], title: `Story Illustration ${i+1}` });
      } else {
        sequence.push({ type: 'image', src: undefined, title: 'Story Illustration' });
      }
    }
    // 8: Insert a notice about remaining pages based on user selection
    // Remaining pages = total selected pages minus the 4 story pages included in the sample
    const remaining = Math.max(0, (typeof selectedLength === 'number' ? selectedLength : 10) - 4);
    sequence.push({ type: 'text', text: `and ${remaining} pages more to generate` });
    // 9-11: Last static pages
    sequence.push({ type: 'image', src: '/page-last-001.png' });
    sequence.push({ type: 'image', src: '/page-last-002.png' });
    sequence.push({ type: 'image', src: '/page-last-003.png' });

    const [navLock, setNavLock] = useState(false);
    const [thirdDedication, setThirdDedication] = useState('');
    const [thirdDedX, setThirdDedX] = useState(0.5); // 0..1
    const [thirdDedY, setThirdDedY] = useState(0.8); // 0..1
    const [thirdFont, setThirdFont] = useState<'serif'|'sans'|'hand'>('serif');
    const [thirdSize, setThirdSize] = useState(18);
    const [thirdColor, setThirdColor] = useState<string>('#000000');
    const [thirdEditing, setThirdEditing] = useState<boolean>(false);
    const [thirdDragging, setThirdDragging] = useState<boolean>(false);
    const thirdRef = useRef<HTMLDivElement | null>(null);
    const thirdDraggingRef = useRef(false);
    const fontMap = useMemo(() => ({
      serif: 'Georgia, serif',
      sans: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      hand: '"Comic Sans MS", "Comic Sans", cursive',
    } as Record<string,string>), []);
    useEffect(() => {
      // Clamp parent-controlled index if sequence length changes
      const clamped = Math.max(0, Math.min(idx, sequence.length - 1));
      if (clamped !== idx) onIdxChange(clamped);
      // Emit meta info
      const cur = sequence[clamped];
      const label = cur?.title ? String(cur.title) : `Page ${clamped + 1}`;
      onMetaChange && onMetaChange(label, sequence.length);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedLength, pages.length, idx]);
    const canPrev = idx > 0;
    const canNext = idx < sequence.length - 1;
    const cur = sequence[idx];

    return (
      <div className="space-y-3">
        <div className="text-center text-sm text-muted-foreground">Page {idx+1} of {sequence.length}</div>
        <div className="mx-auto w-full max-w-[95vw] border rounded-md bg-white p-4 overflow-hidden">
          {cur.type === 'image' ? (
            <div
              className="relative mx-auto w-full aspect-square bg-neutral-100 rounded overflow-hidden"
              style={{ width: 'min(80vw, 70vh)' }}
              ref={thirdRef}
              onMouseDown={(e) => {
                if (idx !== 2 || !thirdRef.current) return;
                thirdDraggingRef.current = true;
                setThirdDragging(true);
                const r = thirdRef.current.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                setThirdDedX(Math.max(0.05, Math.min(0.95, x)));
                setThirdDedY(Math.max(0.05, Math.min(0.95, y)));
              }}
              onMouseMove={(e) => {
                if (!thirdDraggingRef.current || idx !== 2 || !thirdRef.current) return;
                const r = thirdRef.current.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width;
                const y = (e.clientY - r.top) / r.height;
                setThirdDedX(Math.max(0.05, Math.min(0.95, x)));
                setThirdDedY(Math.max(0.05, Math.min(0.95, y)));
              }}
              onMouseUp={() => { thirdDraggingRef.current = false; setThirdDragging(false); }}
              onMouseLeave={() => { thirdDraggingRef.current = false; setThirdDragging(false); }}
              onTouchStart={(e) => {
                if (idx !== 2 || !thirdRef.current) return;
                const t = e.touches[0];
                const r = thirdRef.current.getBoundingClientRect();
                const x = (t.clientX - r.left) / r.width;
                const y = (t.clientY - r.top) / r.height;
                setThirdDragging(true);
                setThirdDedX(Math.max(0.05, Math.min(0.95, x)));
                setThirdDedY(Math.max(0.05, Math.min(0.95, y)));
              }}
              onTouchMove={(e) => {
                if (!thirdRef.current) return;
                const t = e.touches[0];
                const r = thirdRef.current.getBoundingClientRect();
                const x = (t.clientX - r.left) / r.width;
                const y = (t.clientY - r.top) / r.height;
                setThirdDedX(Math.max(0.05, Math.min(0.95, x)));
                setThirdDedY(Math.max(0.05, Math.min(0.95, y)));
              }}
              onTouchEnd={() => { thirdDraggingRef.current = false; setThirdDragging(false); }}
            >
              {cur.src ? (
                <Image src={cur.src} alt={cur.title || 'Page'} width={1920} height={1920} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full">
                  {String(cur.title || '') === 'Blank' ? (
                    <div className="w-full h-full bg-white flex items-center justify-center text-neutral-500 italic">
                      This page intentionally left blank
                    </div>
                  ) : String(cur.title || '').startsWith('IMG_PLACEHOLDER_') ? (
                    <div className="w-full h-full bg-neutral-200 flex items-center justify-center text-neutral-600 font-medium p-4 text-center">
                      {String(cur.title||'').split('|')[1] || 'generated image'}
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white" />
                  )}
                </div>
              )}
              {idx === 2 && thirdDedication.trim() && (
                <div
                  className="absolute -translate-x-1/2"
                  style={{ left: `${thirdDedX*100}%`, top: `${thirdDedY*100}%`, width: '70%' }}
                >
                  <div
                    className={"mx-auto backdrop-blur-sm rounded px-3 py-2 shadow-sm text-center transition-colors " + ((thirdDragging || thirdEditing) ? 'bg-white/85 border border-black/10' : 'bg-transparent border-0')}
                    style={{ fontFamily: fontMap[thirdFont], fontSize: `${thirdSize}px`, whiteSpace: 'pre-line', color: thirdColor }}
                  >
                    {thirdDedication}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="relative mx-auto w-full aspect-square bg-white border rounded overflow-auto flex items-center justify-center p-4"
              style={{ width: 'min(80vw, 70vh)' }}
            >
              <div className="prose prose-sm max-w-none text-center">
                <p>{cur.text}</p>
              </div>
            </div>
          )}
          {idx === 2 && (
            <div className="mt-3 space-y-2">
              <div>
                <label className="text-sm text-muted-foreground">Add a dedication (optional)</label>
                <textarea
                  className="mt-1 w-full border rounded p-2 text-sm"
                  placeholder="A special message to appear on this page..."
                  value={thirdDedication}
                  onChange={(e) => {
                    const words = e.target.value.trim().split(/\s+/).filter(Boolean);
                    const trimmed = words.length > 50 ? words.slice(0,50).join(' ') : e.target.value;
                    setThirdDedication(trimmed);
                  }}
                  onFocus={() => setThirdEditing(true)}
                  onBlur={() => setThirdEditing(false)}
                  rows={2}
                />
                <div className="text-[10px] text-muted-foreground mt-0.5 text-right">{Math.min(thirdDedication.trim() ? thirdDedication.trim().split(/\s+/).length : 0, 50)}/50</div>
              </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Font</span>
                    <select
                      className="h-7 border rounded px-2 bg-background"
                      value={thirdFont}
                      onChange={(e)=> setThirdFont(e.target.value as any)}
                    >
                      <option value="serif">Serif</option>
                      <option value="sans">Sans</option>
                      <option value="hand">Handwritten</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Size</span>
                    <input type="range" min={12} max={36} value={thirdSize} onChange={(e)=> setThirdSize(Number(e.target.value))} />
                    <span>{thirdSize}px</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Color</span>
                    <input
                      type="color"
                      value={thirdColor}
                      onChange={(e) => setThirdColor(e.target.value)}
                      className="h-7 w-10 p-0 border rounded cursor-pointer"
                      aria-label="Dedication text color"
                    />
                  </div>
                  <div className="text-muted-foreground">Tip: drag the text on the image to reposition</div>
                </div>
              </div>
            )}
        </div>
        {/* Navigation is handled by dialog footer */}
      </div>
    );
  }

  // Resolve storyId once from theme slug or explicit storyId param
  const storyId = useMemo(() => {
    const themeSlug = searchParams.get('theme');
    const storyIdParam = searchParams.get('storyId');
    if (storyIdParam) return storyIdParam;
    const map: Record<string, string> = {
      adventure: 'adventure_flexible_multiage',
      friendship: 'friendship_flexible_multiage',
      family: 'family_flexible_multiage',
      dreams: 'dreams_flexible_multiage',
    };
    return themeSlug ? map[themeSlug] : undefined;
  }, [searchParams]);

  // Log full preview context when opening the modal for debugging
  useEffect(() => {
    if (readerOpen) {
      try {
        // eslint-disable-next-line no-console
        console.log('[Preview] Opened with', {
          previewData,
          storyImages: (previewData as any)?.storyImages || [],
          pages: dbPages,
        });
      } catch {}
    }
  }, [readerOpen]);

  // Progress moved to upload-photo step

  useEffect(() => {
    // Build preview data from URL + session storage
    const heroName = searchParams.get('heroName');
    const themeParam = searchParams.get('theme');
    const storyIdParam = searchParams.get('storyId');
    
    // For backward compatibility, also check for themeId and title
    const themeId = searchParams.get('themeId') || storyIdParam || themeParam;
    const title = searchParams.get('title') || `${heroName}'s ${themeParam || 'Adventure'} Story`;
    
    if (heroName) {
      let coverImage = '';
      let originalImage = '';
      let storyImagesLocal: string[] = [];
      try {
        const piRaw = sessionStorage.getItem('preview_images');
        if (piRaw) {
          const pi = JSON.parse(piRaw);
          coverImage = String(pi.coverImage || '');
          originalImage = String(pi.originalImage || '');
          if (Array.isArray(pi.storyImages)) storyImagesLocal = pi.storyImages.map((s: any) => String(s || ''));
        }
      } catch {}
      
      // Only redirect if we don't have the essential data
      if (!coverImage && !originalImage) {
        toast.error('Preview images missing - redirecting to create page');
        router.push('/create');
        return;
      }
      
      setPreviewData({
        id: `preview-${Date.now()}`,
        title,
        themeId: themeId || 'adventure',
        coverImage,
        originalImage,
        storyTemplate: { id: themeId || 'adventure', theme: themeParam || 'Adventure', title, pages: [] },
        pages: [{ id: 'title-page', type: 'title', title, text: `A magical story featuring ${heroName}!`, imageUrl: '' }],
        heroName,
        theme: themeParam || 'Adventure',
        createdAt: new Date().toISOString(),
        storyImages: storyImagesLocal,
      } as any);
    } else {
      toast.error('Hero name missing - redirecting to create page');
      router.push('/create');
    }
    setIsLoading(false);
  }, [searchParams, theme, router]);

  // Load placeholder values saved in session
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('placeholder_values');
      if (raw) setPlaceholderValues(JSON.parse(raw));
    } catch {}
  }, []);

  // Fetch outline pages from Supabase
  useEffect(() => {
    const fetchPages = async () => {
      const themeSlug = searchParams.get('theme');
      const storyIdParam = searchParams.get('storyId');
      const ageGroup = searchParams.get('age') || '5-6';
      if (!themeSlug && !storyIdParam) return;
      const map: Record<string, string> = {
        adventure: 'adventure_flexible_multiage',
        friendship: 'friendship_flexible_multiage',
        family: 'family_flexible_multiage',
        dreams: 'dreams_flexible_multiage',
      };
      const storyId = storyIdParam || (themeSlug ? map[themeSlug] : undefined);
      if (!storyId) return;
      const ageNum = parseInt((ageGroup.split('-')[0] || '5'), 10);
      const { data, error } = await supabase.rpc('get_story_pages_full_for_age', { p_story_id: storyId, p_age: ageNum });
      if (!error && Array.isArray(data)) {
        setDbPages((data as any[]).map((r: any) => ({
          pageNumber: Number(r.page_number),
          text: String(r.text || ''),
          imageDescription: String(r.image_description || ''),
          kind: String(r.kind || 'content'),
          isTitle: Boolean(r.is_title),
          isDedication: Boolean(r.is_dedication),
          raw: r.raw,
        })));
      }
    };
    fetchPages();
  }, [searchParams]);

  const applyPlaceholders = (text: string) => {
    if (!text) return '';
    let out = text;
    const values = {
      ...(placeholderValues || {}),
      heroName: previewData?.heroName || placeholderValues?.heroName || 'Hero',
    } as Record<string, string>;
    for (const [k, v] of Object.entries(values)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? '');
    }
    return out;
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
        <p className="text-muted-foreground">The preview you&apos;re looking for could not be found.</p>
        <Button asChild>
          <Link href="/create">Go Back to Create</Link>
        </Button>
      </div>
    );
  }

  const heroName = previewData.heroName || placeholderValues.heroName || '';

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Progress Steps */}
      <ProgressSteps 
        mode={mode} 
        currentStep={2} 
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Your Preview</h1>
        <div className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-3"></div>
      </div>
      <div className="max-w-xl mx-auto">
        <div className="rounded-md bg-primary/10 border border-primary/30 px-4 py-3 text-center">
          <div className="text-base sm:text-lg font-semibold text-primary">Theme: {previewData.theme}</div>
          <div className="text-sm sm:text-base font-medium mt-1">{previewData.title}</div>
          <div className="text-xs sm:text-sm text-muted-foreground mt-1">{selectedLength} pages • Age {selectedAge}</div>
        </div>
      </div>

      {/* Cover vs Original */}
      <Card className="mb-2">
        <CardContent className="p-4 space-y-3">
          {/* Child name + More options inside the same box */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label htmlFor="child-name" className="text-base font-medium">Child’s name</Label>
                <Input
                  id="child-name"
                  value={heroName}
                  placeholder="e.g., Daniyal"
                  className={`mt-2 ${nameError ? 'border-destructive' : ''}`}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNameError(value.trim() ? null : 'Please enter a name to continue.');
                    // Update previewData + placeholderValues and persist
                    setPreviewData((pd) => (pd ? { ...pd, heroName: value } as any : pd));
                    setPlaceholderValues((prev) => ({ ...(prev || {}), heroName: value }));
                    if (debounceRef.current) clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => {
                      try {
                        const raw = sessionStorage.getItem('placeholder_values');
                        const base = raw ? JSON.parse(raw) : {};
                        sessionStorage.setItem('placeholder_values', JSON.stringify({ ...base, heroName: value }));
                      } catch {}
                    }, 250);
                  }}
                />
                {nameError && <div className="text-xs text-destructive mt-1">{nameError}</div>}
              </div>
              {storyId && (
                <Dialog open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="whitespace-nowrap h-10">More options</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Customize details</DialogTitle>
                    </DialogHeader>
                    <div className="text-xs text-muted-foreground mb-2">Updates preview live</div>
                    <PlaceholdersForm
                      storyId={storyId}
                      excludeKeys={["heroName"]}
                      initialValues={placeholderValues}
                      onChange={(vals) => setPlaceholderValues(vals)}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          {/* Selections: Age group and Pages (moved below name) */}
          <div className="w-full max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Age group</div>
                <div className="flex gap-2 mt-2 overflow-x-auto whitespace-nowrap">
                  {AGE_GROUPS.map((a) => (
                    <button key={a.id} type="button" onClick={() => setSelectedAge(a.id)} className={`px-4 py-3 border rounded-full text-base ${selectedAge===a.id?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted'}`}>{a.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Number of pages</div>
                <div className="flex gap-2 mt-2 overflow-x-auto whitespace-nowrap">
                  {LENGTHS.map((len) => (
                    <button key={len} type="button" onClick={() => setSelectedLength(len)} className={`px-4 py-3 border rounded-md text-base ${selectedLength===len?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted'}`}>{len} pages</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-center">Generated Front Page</div>
              <div
                className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden w-full max-w-4xl mx-auto"
              >
                {previewData.coverImage ? (
                  <Image src={previewData.coverImage} alt={previewData.title} width={512} height={512} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-100/50 flex items-center justify-center border-2 border-dashed border-primary/30">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-1">📚</div>
                      <p className="font-semibold text-primary">Your Book Cover</p>
                      <p className="text-xs text-muted-foreground mt-1">“{previewData.title}”</p>
                      <p className="text-xs text-muted-foreground mt-1">AI‑personalized for {heroName || 'your child'}</p>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-semibold text-center">Original Photo</div>
              <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden w-full max-w-4xl mx-auto">
                {previewData.originalImage ? (
                  <Image src={previewData.originalImage} alt="Original uploaded photo" width={512} height={512} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border-2 border-dashed border-blue-300">
                    <div className="text-center p-4">
                      <div className="text-3xl mb-1">👶</div>
                      <p className="font-semibold text-blue-700">Photo Uploaded</p>
                      <p className="text-xs text-muted-foreground mt-1">Used for AI personalization</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center pt-1">
            <Button size="sm" onClick={() => { setReaderOpen(true); }}>Preview Story</Button>
          </div>
      </CardContent>
    </Card>


      

      {/* Bottom actions similar to Upload Photo */}
      <div className="max-w-6xl mx-auto px-2 sm:px-0 flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => {
            const themeSlug = searchParams.get('theme') || '';
            const sId = storyId || '';
            const qs = new URLSearchParams({ mode, ...(themeSlug?{theme:themeSlug}:{}) as any, ...(sId?{storyId:sId}:{}) as any });
            router.push(`/create/upload-photo?${qs.toString()}`);
          }}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Edit
        </Button>
        <Button
          size="lg"
          onClick={async () => {
            if (!heroName.trim()) { setNameError('Please enter a name to continue.'); return; }
            try {
              const age = selectedAge;
              const themeSlug = searchParams.get('theme') || previewData.themeId;
              const lengthSel = selectedLength;
              const res = await fetch('/api/book/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: previewData.title,
                  theme: themeSlug,
                  age_group: age,
                  length: lengthSel,
                  mode,
          placeholders: { ...(placeholderValues||{}), heroName },
                })
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'Failed to create book');
              const bookId = data.bookId as string;
              const themeSlugParam = searchParams.get('theme') || '';
              const styleParam = searchParams.get('style') || '';
              const qs = new URLSearchParams({
                type: lengthSel === 10 ? 'free' : 'digital',
                length: String(lengthSel),
                bookId,
                mode,
                age,
                ...(themeSlugParam ? { theme: themeSlugParam } : {} as any),
                ...(storyId ? { storyId } : {} as any),
                ...(styleParam ? { style: styleParam } : {} as any),
              });
              router.push(`/checkout?${qs.toString()}`);
            } catch (e: any) {
              toast.error(e?.message || 'Failed to create book');
            }
          }}
        >
          {selectedLength===10 ? 'Continue (Free sample)' : selectedLength===20 ? 'Continue ($14.99)' : 'Continue ($19.99)'}
        </Button>
      </div>

      {/* Removed confirm modal: preview opens directly */}

      {/* Book-like reader modal */}
      <Dialog open={readerOpen} onOpenChange={(open)=> { setReaderOpen(open); if (!open) { setCurrentIdx(0); } }}>
        <DialogContent className="w-auto max-h-[90vh] overflow-auto" style={{ maxWidth: 'min(90vw, 80vh)' }}>
          <DialogHeader className="">
            <DialogTitle>{previewData.title}</DialogTitle>
            <div className="text-xs text-muted-foreground">{currentPageTitle || `Page ${currentIdx + 1}`}</div>
          </DialogHeader>
          <BookPreview
            coverImage={previewData.coverImage}
            storyImages={(previewData as any)?.storyImages || []}
            pages={dbPages}
            selectedLength={selectedLength}
            applyText={applyPlaceholders}
            idx={currentIdx}
            onIdxChange={(n)=> setCurrentIdx(n)}
            onMetaChange={(label, len) => { setCurrentPageTitle(label); setSequenceLen(len); }}
          />
          <DialogFooter className="">
            <div className="w-full flex items-center justify-between">
              <Button type="button" variant="outline" onClick={(e)=> { e.preventDefault(); setCurrentIdx((i)=> Math.max(0, i-1)); }} disabled={currentIdx <= 0}>Previous</Button>
              <div className="text-xs text-muted-foreground">Page {sequenceLen ? currentIdx+1 : 0} of {sequenceLen || 0}</div>
              <Button type="button" onClick={(e)=> { e.preventDefault(); setCurrentIdx((i)=> Math.min(sequenceLen-1, i+1)); }} disabled={currentIdx >= sequenceLen - 1}>Next</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
