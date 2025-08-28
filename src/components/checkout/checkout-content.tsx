"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PRICING, THEMES } from '@/lib/constants';
import { ProgressSteps } from '@/components/create/progress-steps';
// Avoid preview-context; read from session
import { ArrowLeft } from 'lucide-react';

export function CheckoutContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const type = sp.get('type') || 'digital';
  const selectedLength = Number(sp.get('length') || (type === 'free' ? 5 : 20));
  const mode = sp.get('mode') || 'ai-assisted';
  const selectedAge = sp.get('age') || '5-6';
  const styleParam = (sp.get('style') as 'anime'|'comic-book'|'childrens-cartoon' | null) || null;
  const [displayCover, setDisplayCover] = useState<string>('');
  const [displayOriginal, setDisplayOriginal] = useState<string>('');
  const [heroName, setHeroName] = useState<string>('');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [pages, setPages] = useState<{ pageNumber: number; text: string }[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [address, setAddress] = useState({ name: '', line1: '', city: '', state: '', postal: '', country: '' });
  const [shippingQuote, setShippingQuote] = useState<{ service: string; cents: number } | null>(null);
  const [printSpec, setPrintSpec] = useState<{ length: number; cover: 'softcover' | 'hardcover' }>({ length: 20, cover: 'softcover' });
  const [printSubtotalCents, setPrintSubtotalCents] = useState<number>(0);
  const [shippingOptions, setShippingOptions] = useState<{ service: string; eta: string; shipping_cents: number; total_cents: number }[]>([]);
  const [quoting, setQuoting] = useState(false);
  const [autoQuoted, setAutoQuoted] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Load placeholders, images saved from preview
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('placeholder_values');
      if (raw) {
        const parsed = JSON.parse(raw);
        setPlaceholderValues(parsed);
        if (parsed.heroName) setHeroName(parsed.heroName);
      }
      const pi = sessionStorage.getItem('preview_images');
      if (pi) {
        const obj = JSON.parse(pi);
        setDisplayCover(String(obj.coverImage || ''));
        setDisplayOriginal(String(obj.originalImage || ''));
      }
    } catch {}
  }, []);

  const [storyIdForCheckout, setStoryIdForCheckout] = useState<string | undefined>(undefined);

  const selectedThemeName = useMemo(() => {
    const slug = sp.get('theme') || '';
    const found = THEMES.find(t => t.slug === slug);
    return found?.name || (slug ? slug : '—');
  }, [sp]);

  const styleLabel = useMemo(() => {
    const map: Record<string, string> = {
      'watercolor': 'Soft Watercolor',
      'bright-cartoon': 'Bright Cartoon',
      'paper-collage': 'Paper Collage',
      'fairytale': 'Fantasy Fairytale',
      'crayon-marker': 'Crayon & Marker',
      'anime-chibi': 'Anime Chibi',
      // Legacy compatibility
      'childrens-cartoon': 'Bright Cartoon',
      'anime': 'Anime Chibi',
      'comic-book': 'Fantasy Fairytale',
    };
    return (styleParam && map[styleParam]) || 'Bright Cartoon';
  }, [styleParam]);

  // Resolve the exact template variant at checkout and persist story_id in session
  useEffect(() => {
    const resolveTemplate = async () => {
      setLoadingPages(true);
      try {
        const ageGroup = sp.get('age') || '5-6';
        const ageNum = parseInt((ageGroup.split('-')[0] || '5'), 10);
        const length = Number(sp.get('length') || 20);

        // Prefer explicit storyId from URL
        const urlStoryId = sp.get('storyId');
        if (urlStoryId) {
          const qs = new URLSearchParams({ storyId: urlStoryId, age: String(ageNum), includePages: 'true', includeData: 'true' });
          const resp = await fetch(`/api/templates/by-series?${qs.toString()}`);
          if (resp.ok) {
            const json = await resp.json();
            console.log('loaded with pages', json);
            const sid = json?.selected?.story_id || urlStoryId;
            setStoryIdForCheckout(sid);
            const seriesKey = json?.selected?.series_key || null;
            const title = json?.selected?.title || '';
            const theme = json?.selected?.theme || '';
            const pageCount = json?.selected?.page_count || Number(sp.get('length') || 20);
            const pageList = Array.isArray(json?.selected?.data?.pages)
              ? json.selected.data.pages.map((r: any) => ({
                  pageNumber: Number(r.pageNumber),
                  text: String(r.text[selectedAge] || ''),
                  imageDescription: String(r.imageDescription || ''),
                }))
              : [];
            setPages(pageList.map((p: any) => ({ pageNumber: p.pageNumber, text: p.text })));
            const storyObj = { storyId: sid, seriesKey, title, theme, pageCount, age: ageGroup, pages: pageList };
            try {
              sessionStorage.setItem('selected_story_template', JSON.stringify(storyObj));
              sessionStorage.setItem('selected_story', JSON.stringify(storyObj));
            } catch {}
          }
          return;
        }

        // Otherwise use selected_series from session + length
        let seriesKey: string | null = null;
        try {
          const ss = sessionStorage.getItem('selected_series');
          if (ss) seriesKey = String(JSON.parse(ss)?.series_key || '') || null;
        } catch {}
        if (!seriesKey) return;

        const qs = new URLSearchParams({ seriesKey, pageCount: String(length), age: String(ageNum), includePages: 'true', includeData: 'true' });
        const resp = await fetch(`/api/templates/by-series?${qs.toString()}`);
        if (!resp.ok) return;
        const json = await resp.json();

        console.log('loaded with pages2', json);
        const sid = json?.selected?.story_id || json?.templates?.[0]?.story_id || undefined;
        if (sid) {
          setStoryIdForCheckout(sid);
          const seriesFromResp = json?.selected?.series_key || seriesKey;
          const title = json?.selected?.title || '';
          const theme = json?.selected?.theme || '';
          const pageList = Array.isArray(json?.selected?.data?.pages)
            ? json.selected.data.pages.map((r: any) => ({
                pageNumber: Number(r.pageNumber),
                text: applyPlaceholders(String(r.text[selectedAge] || '')),
                imageDescription: String(r.imageDescription || ''),
              }))
            : [];
          const storyObj = { storyId: sid, seriesKey: seriesFromResp, title, theme, pageCount: length, age: ageGroup, pages: pageList };
          try {
            sessionStorage.setItem('selected_story_template', JSON.stringify(storyObj));
            sessionStorage.setItem('selected_story', JSON.stringify(storyObj));
          } catch {}
        }
        if (Array.isArray(json?.pages)) {
          const pageList = json.pages.map((r: any) => ({ pageNumber: Number(r.pageNumber), text: applyPlaceholders(String(r.text || '')) }));
          setPages(pageList);
        }
      } finally {
        setLoadingPages(false);
      }
    };
    resolveTemplate();
  }, [sp]);

  // Ensure pages are persisted in session for the build screen
  useEffect(() => {
    if (!storyIdForCheckout) return;
    try {
      const raw = sessionStorage.getItem('selected_story');
      const existing = raw ? JSON.parse(raw) : {};
      const hasExistingPages = Array.isArray(existing?.pages) && existing.pages.length > 0;
      if (!hasExistingPages && pages.length > 0) {
        const length = Number(sp.get('length') || 20);
        const ageGroup = sp.get('age') || '5-6';
        const updated = {
          ...(existing || {}),
          storyId: storyIdForCheckout,
          pageCount: existing?.pageCount || length,
          age: existing?.age || ageGroup,
          // Note: this path only has text/number; earlier resolution saved imageDescription as well
          pages: pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text })),
        };
        sessionStorage.setItem('selected_story', JSON.stringify(updated));
        sessionStorage.setItem('selected_story_template', JSON.stringify({ storyId: storyIdForCheckout }));
      }
    } catch {}
  }, [storyIdForCheckout, pages]);

  const applyPlaceholders = (text: string) => {
    if (!text) return '';
    let out = text;
    const values = {
      ...(placeholderValues || {}),
      heroName: heroName || placeholderValues?.heroName || 'Hero',
    } as Record<string, string>;
    for (const [k, v] of Object.entries(values)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? '');
    }
    return out;
  };

  const getSubtotal = () => {
    if (type === 'free') return 0;
    if (type === 'digital') {
      if (selectedLength === 30) return 1999; // $19.99
      if (selectedLength === 20) return 1499; // $14.99
      if (selectedLength === 10) return 0;
      return Math.round(PRICING.DIGITAL_FULL * 100);
    }
    if (type === 'canva') return Math.round(PRICING.CANVA_EXPORT * 100);
    return printSubtotalCents || 0;
  };

  const handleProceed = async () => {
    // Assume payment and proceed to builder
    const qs = new URLSearchParams({
      theme: sp.get('theme') || '',
      length: String(selectedLength),
      age: selectedAge,
      mode,
      style: sp.get('style') || '',
    });
    router.push(`/build?${qs.toString()}`);
  };

  // Debug: log all information captured on the checkout page
  useEffect(() => {
    try {
      const info = {
        query: {
          type,
          mode,
          selectedLength,
          age: sp.get('age') || undefined,
          theme: sp.get('theme') || undefined,
          storyId: storyIdForCheckout,
        },
        images: {
          hasCover: Boolean(displayCover),
          hasOriginal: Boolean(displayOriginal),
        },
        heroName,
        placeholders: placeholderValues,
        story: {
          pagesCount: pages.length,
          pages: pages,
        },
        pricing: {
          subtotalCents: getSubtotal(),
          type,
        },
        print: {
          spec: printSpec,
          estimatedPrintSubtotalCents: printSubtotalCents,
          shippingOptions,
          shippingQuote,
        },
        address,
      };
      // Grouped log for readability
      // eslint-disable-next-line no-console
      console.log('[Checkout] State snapshot', info);
    } catch {}
    // We intentionally include broad deps to capture state changes
  }, [
    type,
    mode,
    selectedLength,
    displayCover,
    displayOriginal,
    heroName,
    placeholderValues,
    pages,
    address,
    shippingQuote,
    printSpec,
    printSubtotalCents,
    shippingOptions,
    storyIdForCheckout,
    sp,
  ]);

  // Auto-quote estimated print cost after address is filled (shipping not included)
  // Debounced to avoid rapid calls while typing.
  useEffect(() => {
    if (type !== 'print') return;
    const filled = address.name && address.line1 && address.city && address.state && address.postal && address.country;
    if (!filled) { setAutoQuoted(false); return; }
    const t = setTimeout(async () => {
      try {
        setQuoteError(null);
        const res = await fetch('/api/lulu/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, spec: { ...printSpec } })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to get quote');
        setPrintSubtotalCents((data.print_cost_cents || 0) + (data.fulfillment_cents || 0));
        setShippingOptions([]); // only show after user requests delivery options
        setShippingQuote(null);
        setAutoQuoted(true);
      } catch (e: any) {
        setQuoteError(e?.message || 'Failed to get estimate');
        setAutoQuoted(false);
      }
    }, 600);
    return () => clearTimeout(t);
  }, [type, address, printSpec]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Progress steps for consistency */}
      <ProgressSteps mode={mode} currentStep={3} />

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Checkout</h1>
        <div className="text-sm sm:text-base text-muted-foreground flex items-center justify-center gap-3">
          {type === 'digital' ? `Buy digital book (${selectedLength} pages)` : type === 'free' ? 'Get free sample (watermarked)' : type === 'canva' ? 'Export to Canva add-on' : 'Order a printed book (quotes shown below)'}
        </div>
      </div>

      {/* Book details + preview */}
          <Card>
            <CardHeader>
              <CardTitle>Book Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-center">Front Page (generated)</div>
                  <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden w-full max-w-2xl mx-auto">
                    {displayCover ? (
                      <Image src={displayCover} alt={'Generated front page'} width={800} height={600} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-purple-100/50 flex items-center justify-center border-2 border-dashed border-primary/30">
                        <div className="text-center p-4">
                          <div className="text-3xl mb-1">📚</div>
                          <p className="font-semibold text-primary">Your Book Front Page</p>
                          <p className="text-xs text-muted-foreground mt-1">AI‑personalized {heroName ? `for ${heroName}` : ''}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

          {/* Story preview removed per request */}

              {/* Selections summary */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                <div className="rounded border bg-muted/30 p-3">
                  <div className="text-muted-foreground">Pages</div>
                  <div className="font-medium">{selectedLength}</div>
                </div>
                <div className="rounded border bg-muted/30 p-3">
                  <div className="text-muted-foreground">Age group</div>
                  <div className="font-medium">{selectedAge}</div>
                </div>
                <div className="rounded border bg-muted/30 p-3">
                  <div className="text-muted-foreground">Style</div>
                  <div className="font-medium">{styleLabel}</div>
                </div>
                <div className="rounded border bg-muted/30 p-3">
                  <div className="text-muted-foreground">Theme</div>
                  <div className="font-medium">{selectedThemeName}</div>
                </div>
              </div>
            </CardContent>
          </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>
                Subtotal{type==='print' ? '*' : ''}
              </span>
              <span>${(getSubtotal()/100).toFixed(2)}</span>
            </div>
            {type==='print' && shippingQuote && (
              <div className="flex justify-between text-sm"><span>Shipping</span><span>${(shippingQuote.cents/100).toFixed(2)}</span></div>
            )}
            <div className="border-t pt-2 font-bold flex justify-between"><span>Total</span><span>${((getSubtotal()+ (shippingQuote?.cents||0))/100).toFixed(2)}</span></div>
            {type==='print' && (
              <div className="text-xs text-muted-foreground">* Delivery cost not included.</div>
            )}
            {/* Actions moved to fixed footer */}
            <div className="mt-3 bg-muted/30 border rounded p-3 text-xs text-muted-foreground space-y-2">
              <p>
                After you continue{type==='free' ? '' : ' and complete payment'}, we’ll start creating your book. This can take a few minutes.
                We’ll email you as soon as it’s ready. Thank you for using Snap2Story!
              </p>
              <p>
                If you need help at any time, we’re happy to assist:
                <a href="mailto:support@storymosaic.com" className="underline text-primary"> support@storymosaic.com</a>
              </p>
            </div>
            <div className="text-xs text-muted-foreground">Loyalty: +10 pts per paid full book. Referral codes applied at payment.</div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom actions similar to Upload Photo */}
      <div className="max-w-6xl mx-auto px-2 sm:px-0 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button onClick={handleProceed}>
          {type === 'free' ? 'Get Free Sample' : 'Proceed to Payment'}
        </Button>
      </div>
    </div>
  );
}

function StoryCarousel({ pages, loading, applyText }: { pages: { pageNumber: number; text: string }[]; loading: boolean; applyText: (t: string)=>string; }) {
  const [idx, setIdx] = useState(0);
  const total = pages?.length || 0;
  const canPrev = idx > 0;
  const canNext = idx < Math.max(0, total - 1);

  useEffect(() => {
    if (idx > total - 1) setIdx(Math.max(0, total - 1));
  }, [total]);

  if (loading) {
    return <div className="h-32 rounded border bg-muted/30 animate-pulse" />;
  }
  if (!pages || pages.length === 0) {
    return <div className="text-sm text-muted-foreground">Pages will appear here once available.</div>;
  }

  const cur = pages[idx];
  return (
    <div className="rounded border bg-white overflow-hidden">
      <div className="p-3 border-b flex items-center justify-between text-xs text-muted-foreground">
        <div>Page {idx + 1} of {total}{typeof cur?.pageNumber === 'number' ? ` • #${cur.pageNumber}` : ''}</div>
        <div className="flex items-center gap-2">
          <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={()=> setIdx(i=>Math.max(0, i-1))} disabled={!canPrev}>Prev</button>
          <button className="px-2 py-1 border rounded disabled:opacity-50" onClick={()=> setIdx(i=>Math.min(total-1, i+1))} disabled={!canNext}>Next</button>
        </div>
      </div>
      <div className="p-4">
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{applyText(cur?.text || '')}</div>
      </div>
    </div>
  );
}
