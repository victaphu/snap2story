'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Compass, Heart, Home, Moon, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { THEMES } from '@/lib/constants';
import { ProgressSteps } from './progress-steps';
import { LoadingPage } from '@/components/ui/loading-spinner';
// Load themes via server route to bypass RLS

const themeIcons: Record<string, any> = {
  adventure: Compass,
  friendship: Heart,
  family: Home,
  dreams: Moon,
  custom: Sparkles,
};

type TemplateItem = { id: string; story_id: string; name: string; slug: string; title: string; description?: string; series_key?: string; page_count?: number; tags?: string[] };
type SeriesGroup = { series_key: string; name: string; slug: string; title: string; tags: string[]; variants: { page_count: number; story_id: string }[] };

export function ChooseThemeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skippedUpload = searchParams.get('skip_upload') === 'true';
  const sampleId = searchParams.get('sampleId');
  const mode = searchParams.get('mode');

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingThemes, setIsFetchingThemes] = useState(true);
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [groups, setGroups] = useState<SeriesGroup[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<{ slug: string; series_key: string } | null>(null);
  const [loadedFromDb, setLoadedFromDb] = useState(false);
  const applyHeroName = (s?: string) => (s ? s.replace(/\{heroName\}/g, 'Bobby') : s);

  // Map DB theme names to slugs used in app
  const nameToSlug = useMemo(
    () => ({
      'Adventure & Exploration': 'adventure',
      'Friendship & Kindness': 'friendship',
      'Family & Home Life': 'family',
      'Dreams & Imagination': 'dreams',
    } as Record<string, string>),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsFetchingThemes(true);
      try {
        // 1) Use local cache first
        const cached = sessionStorage.getItem('themes_list_cache_v2');
        if (cached) {
          const parsed: TemplateItem[] = JSON.parse(cached);
          if (!cancelled && Array.isArray(parsed) && parsed.length) {
            setTemplates(parsed);
            setLoadedFromDb(true);
            return;
          }
        }

        // 2) Fetch once from server, then cache
        const resp = await fetch('/api/themes/list', { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const payload = await resp.json();
        const list: any[] = Array.isArray(payload?.templates) ? payload.templates : [];
        const merged: TemplateItem[] = list.map((row: any) => {
          const name = String(row.name);
          const slug = nameToSlug[name] || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const fallback = THEMES.find(t => t.slug === slug || t.name === name);
          return {
            id: String(row.story_id),
            story_id: String(row.story_id),
            name,
            slug,
            title: String(row.title || name),
            description: fallback?.description,
            // Prefer provided series_key; otherwise, default to slug so
            // multiple page-count variants collapse into a single theme option.
            series_key: String(row.series_key || slug || ''),
            page_count: Number(row.page_count || 20),
            tags: Array.isArray(row.tags) ? row.tags : [],
          };
        });
        if (!cancelled && merged.length > 0) {
          setTemplates(merged);
          setLoadedFromDb(true);
          try { sessionStorage.setItem('themes_list_cache_v2', JSON.stringify(merged)); } catch {}
        } else if (!cancelled) {
          const fb = (THEMES as unknown as any[]).map((t) => ({ id: t.slug, story_id: t.slug, name: t.name, slug: t.slug, title: t.name, description: t.description }));
          setTemplates(fb);
          setLoadedFromDb(false);
        }
      } catch (err) {
        console.warn('Failed to load themes from DB, falling back to constants:', err);
        if (!cancelled) {
          const fb = (THEMES as unknown as any[]).map((t) => ({ id: t.slug, story_id: t.slug, name: t.name, slug: t.slug, title: t.name, description: t.description }));
          setTemplates(fb);
          setLoadedFromDb(false);
        }
      } finally {
        if (!cancelled) setIsFetchingThemes(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nameToSlug]);

  // Build grouped series and tag index
  useEffect(() => {
    if (!templates.length) { setGroups([]); setAllTags([]); return; }
    const map = new Map<string, SeriesGroup>();
    const tagSet = new Set<string>();
    for (const t of templates) {
      if (Array.isArray(t.tags)) t.tags.forEach((tg) => tg && tagSet.add(tg));
      // Group by series_key when available; otherwise by slug to collapse
      // multiple variants (10/20/30 pages) into a single theme tile.
      const key = t.series_key || t.slug || t.story_id;
      if (!map.has(key)) {
        map.set(key, {
          series_key: key,
          name: t.name,
          slug: t.slug,
          title: t.title,
          tags: Array.from(new Set(t.tags || [])),
          variants: [],
        });
      }
      const g = map.get(key)!;
      g.variants.push({ page_count: Number(t.page_count || 20), story_id: t.story_id });
      if (Array.isArray(t.tags) && t.tags.length) {
        g.tags = Array.from(new Set([...(g.tags||[]), ...t.tags]));
      }
    }
    const arr = Array.from(map.values()).map((g) => ({ ...g, variants: g.variants.sort((a,b)=>a.page_count-b.page_count) }));
    setGroups(arr);
    setAllTags(Array.from(tagSet).sort());
  }, [templates]);

  const proceedWithTheme = async (themeSlug: string, storyId?: string) => {
    if (!themeSlug) {
      toast.error('Please select a theme to continue');
      return;
    }

    setIsLoading(true);
    try {
      // Store selected theme
      const themeData = THEMES.find(t => t.slug === themeSlug);
      sessionStorage.setItem('selected_theme', JSON.stringify(themeData));
      // We only select the grouped theme here (not a specific variant)
      // Do not persist selected_story_template at this stage

      // Also pre-load placeholders and set default values, forcing heroName to Bobby
      // Placeholder preloading is deferred until a specific story variant is known

      // Check for new AI-assisted workflow (theme first)
      if (mode === 'ai-assisted' && !sampleId) {
        // Go to upload photo page with theme for AI-assisted mode
        const params = new URLSearchParams({
          mode: 'ai-assisted',
          theme: themeSlug,
          heroName: 'Bobby',
          // Auto-select 10 pages by default after theme selection
          length: '10',
        });
        if (storyId) {
          params.set('storyId', storyId);
        }
        router.push(`/create/upload-photo?${params.toString()}`);
      } else if (sampleId && mode === 'ai-assisted') {
        // Update the sample with selected theme (old workflow)
        const savedSample = sessionStorage.getItem('story_sample');
        if (savedSample) {
          const sampleData = JSON.parse(savedSample);
          sampleData.selectedTheme = themeSlug;
          sessionStorage.setItem('story_sample', JSON.stringify(sampleData));
        }
        
        // Go to payment page for AI-assisted with theme selected, default length=10
        router.push(`/create/payment?sampleId=${sampleId}&mode=${mode}&theme=${themeSlug}&length=10`);
      } else if (themeSlug === 'custom') {
        // For custom theme, redirect to custom editor
        router.push('/create/custom');
      } else {
        // For legacy workflow, go to describe page with theme and default length=10
        router.push(`/create/describe?theme=${themeSlug}&length=10`);
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeSelect = (themeSlug: string, series_key?: string) => {
    setSelectedSeries({ slug: themeSlug, series_key: series_key || themeSlug });
  };

  const handleNext = async () => {
    if (!selectedSeries) return;
    try { sessionStorage.setItem('selected_series', JSON.stringify(selectedSeries)); } catch {}
    
    // Find the selected series group to get a default story ID
    const seriesGroup = groups.find(g => g.series_key === selectedSeries.series_key);
    // Prefer 10-page variant when available; otherwise smallest page count
    const defaultVariant = seriesGroup?.variants?.find(v => v.page_count === 10) || seriesGroup?.variants?.[0];
    const defaultStoryId = defaultVariant?.story_id;
    
    await proceedWithTheme(selectedSeries.slug, defaultStoryId);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const visibleGroups = useMemo(() => {
    if (!selectedTags.length) return groups;
    const set = new Set(selectedTags);
    return groups.filter((g) => g.tags?.some((tg) => set.has(tg)));
  }, [groups, selectedTags]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Progress Steps at Top */}
      <ProgressSteps 
        mode={mode || 'ai-assisted'} 
        currentStep={1} 
        sampleId={sampleId}
        skippedUpload={skippedUpload}
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Choose a Theme</h1>
        <p className="text-xs text-muted-foreground">{loadedFromDb ? 'Themes loaded from database' : 'Using built-in themes'}</p>
        <p className="text-sm sm:text-base text-muted-foreground">
          {mode === 'ai-assisted' && !sampleId
            ? 'Select a story theme to get started with AI-assisted creation'
            : sampleId 
              ? 'Select a theme to customize your story style and mood'
              : `Select a theme that matches the type of story you want to create${skippedUpload ? ' (No photos uploaded - AI will create generic characters)' : ''}`
          }
        </p>
        <p className="text-xs text-muted-foreground">Tap a theme to select. You’ll pick pages on the next step.</p>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {allTags.map((tag) => (
            <button key={tag} type="button" onClick={() => toggleTag(tag)} className={`px-3 py-1 rounded-full border text-xs ${selectedTags.includes(tag) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}>#{tag}</button>
          ))}
          {selectedTags.length > 0 && (
            <button type="button" onClick={() => setSelectedTags([])} className="px-3 py-1 rounded-full border text-xs bg-background hover:bg-muted">Clear</button>
          )}
        </div>
      )}

      {/* Theme selection (grouped by series; select the theme only, not a page variant) */}
      {isFetchingThemes ? (
        <LoadingPage message="Loading themes..." />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleGroups.map((grp) => {
          const Icon = themeIcons[grp.slug as keyof typeof themeIcons] || Sparkles;
          const selected = selectedSeries?.series_key === grp.series_key;
          return (
            <Card
              key={grp.series_key}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${selected ? 'ring-2 ring-primary border-primary' : ''} ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
              onClick={() => handleThemeSelect(grp.slug, grp.series_key)}
              role="button"
              aria-label={`Select ${grp.name} theme`}
            >
              <CardContent className="p-6 space-y-4 relative">
                {selected && (
                  <div className="absolute top-3 right-3 text-primary">
                    <Check className="h-5 w-5" aria-hidden="true" />
                    <span className="sr-only">Selected</span>
                  </div>
                )}
                <div className="text-center">
                  <div className="w-16 h-16 rounded-lg mx-auto flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-base sm:text-lg font-semibold">{applyHeroName(grp.title)}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">{applyHeroName(grp.name)}</p>
                </div>
                {grp.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {(() => {
                      const tags = grp.tags || [];
                      const visible = tags.slice(0, 3);
                      const rest = Math.max(0, tags.length - visible.length);
                      return (
                        <>
                          {visible.map((tg) => (
                            <span key={tg} className="px-2 py-0.5 text-[11px] rounded-full border bg-muted/40 truncate max-w-[9rem]">#{tg}</span>
                          ))}
                          {rest > 0 && (
                            <span className="px-2 py-0.5 text-[11px] rounded-full border bg-muted/40">+{rest}</span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}

      {/* Sticky footer with Next */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/90 backdrop-blur border-t mt-4">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground">{groups.length} series • {templates.length} variants</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.push('/create')}
              aria-label="Go back to create"
              disabled={isLoading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button
              size="lg"
              variant={!selectedSeries ? 'outline' : 'default'}
              className="font-semibold"
              onClick={handleNext}
              aria-label="Continue to the next step"
              disabled={!selectedSeries || isLoading}
            >
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
