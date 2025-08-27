"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProgressSteps } from '@/components/create/progress-steps';
// Note: avoid direct Supabase reads here; use server API endpoints
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useImageGeneration } from '@/lib/hooks/useImageGeneration';
import { toast } from 'sonner';
import { composeDedicationImage } from '@/lib/dedication';
import { composeLastOverlayImage } from '@/lib/compose-last-overlay';
import { STYLE_MAP, FULL_BLEED_TEXT } from '@/lib/constants';
// import { buildGenerationPlan } from '@/lib/plan/buildPlan';

type DbPage = { pageNumber: number; text: string; imageDescription: string; isTitle?: boolean; isDedication?: boolean; raw?: any };

type GenItem = {
  key: string;
  label: string;
  prompt: string;
  status: 'pending' | 'generating' | 'done' | 'error';
  image?: string;
  canEdit?: boolean;
  regenCount?: number;
  storyText?: string;
  pageType?: 'blank' | 'text-only' | 'static' | 'generated';
  staticImagePath?: string;
  progress?: number;
  message?: string;
  errorMessage?: string;
  kind?: 'cover' | 'interior' | 'dedication';
};

export function BuildContent() {
  const sp = useSearchParams();
  const router = useRouter();
  const themeSlug = sp.get('theme') || '';
  const length = Number(sp.get('length') || 20);
  const age = sp.get('age') || '5-6';
  const styleKey = sp.get('style') || 'bright-cartoon';
  const mode = sp.get('mode') || 'ai-assisted';

  const [heroName, setHeroName] = useState('');
  const [originalImage, setOriginalImage] = useState('');
  const [dbPages, setDbPages] = useState<DbPage[]>([]);
  const [items, setItems] = useState<GenItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [autoRun, setAutoRun] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [regenTotal, setRegenTotal] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [etaMs, setEtaMs] = useState<number>(0);
  const [existingCover, setExistingCover] = useState<string>('');
  const [selectedStory, setSelectedStory] = useState<{
    storyId: string;
    seriesKey?: string | null;
    title?: string;
    theme?: string;
    pageCount?: number;
    age?: string | number;
    pages?: any[];
  } | null>(null);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  // Track by stable key to survive plan rebuilds
  const currentGeneratingKeyRef = useRef<string | null>(null);
  const itemsRef = useRef<GenItem[]>([]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  const hasReconnectedRef = useRef(false);
  const [dedication, setDedication] = useState('A special book made with love.');

  // Initialize image generation hook
  const { generateImage, currentJob, isGenerating } = useImageGeneration({
    useWebSocket: true,
    onProgress: (progress) => {
      let idx = currentGeneratingIndex;
      if (idx === null && currentGeneratingKeyRef.current) {
        idx = itemsRef.current.findIndex(it => it.key === currentGeneratingKeyRef.current);
      }
      if (idx !== null && idx >= 0) {
        updateItem(idx, {
          status: 'generating',
          progress: progress.progress,
          message: progress.message,
        });
      }
    },
    onCompleted: (result) => {
      let idx = currentGeneratingIndex;
      if (idx === null && currentGeneratingKeyRef.current) {
        idx = itemsRef.current.findIndex(it => it.key === currentGeneratingKeyRef.current);
      }
      if (idx !== null && idx >= 0 && result.imageUrl) {
        updateItem(idx, {
          status: 'done',
          image: result.imageUrl,
          progress: 100,
        });
        setCurrentIdx(idx);
      }
      setCurrentGeneratingIndex(null);
      currentGeneratingKeyRef.current = null;
      // Clear the persisted markers when job completes
      sessionStorage.removeItem('build_generating_index');
      sessionStorage.removeItem('build_generating_key');
    },
    onFailed: (error) => {
      let idx = currentGeneratingIndex;
      if (idx === null && currentGeneratingKeyRef.current) {
        idx = itemsRef.current.findIndex(it => it.key === currentGeneratingKeyRef.current);
      }
      if (idx !== null && idx >= 0) {
        updateItem(idx, {
          status: 'error',
          errorMessage: error.error,
        });
      }
      setCurrentGeneratingIndex(null);
      currentGeneratingKeyRef.current = null;
      // Clear the persisted markers when job fails
      sessionStorage.removeItem('build_generating_index');
      sessionStorage.removeItem('build_generating_key');
    }
  });

  // Persist current generating index when it changes
  useEffect(() => {
    if (currentGeneratingIndex !== null) {
      sessionStorage.setItem('build_generating_index', String(currentGeneratingIndex));
    }
  }, [currentGeneratingIndex]);
  // Persist generating key
  useEffect(() => {
    if (currentGeneratingKeyRef.current) {
      sessionStorage.setItem('build_generating_key', currentGeneratingKeyRef.current);
    }
  }, [currentGeneratingKeyRef.current]);

  // Check for active jobs on mount and restore progress state
  useEffect(() => {
    // Only run once per job when reconnected
    if (currentJob && isGenerating && !hasReconnectedRef.current) {
      hasReconnectedRef.current = true;
      console.log('🔄 Build screen: Reconnected to active job', currentJob);
      
      // First try to restore the previously generating index
      let generatingIndex = -1;
      const savedKey = sessionStorage.getItem('build_generating_key');
      let savedIndex = sessionStorage.getItem('build_generating_index');
      
      if (savedKey) {
        const idx = items.findIndex(it => it.key === savedKey);
        if (idx >= 0) {
          generatingIndex = idx;
          currentGeneratingKeyRef.current = savedKey;
          console.log('📍 Restored generating key from session:', savedKey, '-> index', generatingIndex);
        }
      }
      if (generatingIndex === -1 && savedIndex !== null) {
        const idx = parseInt(savedIndex, 10);
        if (!isNaN(idx) && idx >= 0 && idx < items.length && items[idx]?.pageType === 'generated') {
          generatingIndex = idx;
          console.log('📍 Restored generating index from session:', generatingIndex);
        }
      }
      
      // If no saved index or invalid, find the first item that's generating or pending
      if (generatingIndex === -1) {
        generatingIndex = items.findIndex(item => 
          item.status === 'generating' || 
          (item.status === 'pending' && item.pageType === 'generated')
        );
      }
      
      // If still nothing found, assume regenerating from start
      if (generatingIndex === -1 && items.length > 0) {
        generatingIndex = items.findIndex(item => item.pageType === 'generated');
        console.log('🔄 No pending items found, starting from first generated item:', generatingIndex);
      }
      
      if (generatingIndex !== -1) {
        setCurrentGeneratingIndex(generatingIndex);
        currentGeneratingKeyRef.current = items[generatingIndex]?.key || null;
        updateItem(generatingIndex, {
          status: 'generating',
          progress: currentJob.progress,
          message: currentJob.message
        });
        setCurrentIdx(generatingIndex);
      }
    }
  }, [currentJob?.jobId]); // Only depend on jobId to avoid loops

  useEffect(() => {
    // restore hero and original image from session
    try {
      const rawPH = sessionStorage.getItem('placeholder_values');
      if (rawPH) {
        const ph = JSON.parse(rawPH);
        if (ph.heroName) setHeroName(String(ph.heroName));
        setPlaceholderValues(ph);
      }
      const piRaw = sessionStorage.getItem('preview_images');
      if (piRaw) {
        const pi = JSON.parse(piRaw);
        if (pi.originalImage) setOriginalImage(String(pi.originalImage));
        if (pi.coverImage) setExistingCover(String(pi.coverImage));
      }
      // Preload selected story (and its pages) if available (from checkout)
      let sel: any = null;
      const rawSel = sessionStorage.getItem('selected_story');
      console.log('selected records is', rawSel);
      if (rawSel) sel = JSON.parse(rawSel);
      if (!sel) {
        const rawTmpl = sessionStorage.getItem('selected_story_template');
        if (rawTmpl) sel = JSON.parse(rawTmpl);
      }
      if (sel) {
        setSelectedStory(sel);
        if (Array.isArray(sel?.pages) && sel.pages.length > 0) {
          const rows: DbPage[] = sel.pages
            .filter((p: any) => Number(p.pageNumber) >= 1)
            .map((p: any) => ({
              pageNumber: Number(p.pageNumber),
              text: String(p.text || ''),
              imageDescription: String(p.imageDescription || ''),
              isTitle: Boolean(p.isTitle || p.pageNumber === 0),
              isDedication: Boolean(p.isDedication || p.pageNumber === 0.5),
              raw: p,
            }));
          if (rows.length > 0) setDbPages(rows);
        }
      }
    } catch {}
  }, []);

  const storyId = useMemo(() => {
    // Prefer storyId from selected_story saved at checkout
    if (selectedStory?.storyId) return String(selectedStory.storyId);
    // Otherwise fallback to explicit selection saved from theme step
    try {
      const raw = sessionStorage.getItem('selected_story_template');
      if (raw) {
        const obj = JSON.parse(raw);
        if (obj?.storyId) return String(obj.storyId);
      }
    } catch {}
    if (!themeSlug) return undefined as string | undefined;
    const map: Record<string, string> = {
      adventure: 'adventure_flexible_multiage',
      friendship: 'friendship_flexible_multiage',
      family: 'family_flexible_multiage',
      dreams: 'dreams_flexible_multiage',
    };
    return map[themeSlug];
  }, [themeSlug, selectedStory?.storyId]);

  // Do not load templates from DB here; rely solely on session (set in checkout)

  const styleDescription = STYLE_MAP[styleKey] || 'Bright storybook';

  const fullBleed = FULL_BLEED_TEXT;

  const applyPH = (text: string) => {
    if (!text) return '';
    let out = text;
    const map = { ...(placeholderValues||{}), heroName: heroName || placeholderValues?.heroName || 'Hero' } as Record<string,string>;
    for (const [k, v] of Object.entries(map)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? '');
    }
    return out;
  };

  const getAgeAppropriateText = (page: DbPage) => {
    // The text field from the database is already age-appropriate
    // Just apply placeholder substitution to it
    return applyPH(page.text);
  };

  // Build generation plan once pages are loaded (with fallback when DB pages are unavailable)
  useEffect(() => {
    const plan: GenItem[] = [];

    console.log(dbPages);

    if (!dbPages || dbPages.length === 0) {
      return; // don't process until db pages is loaded
    }
    
    // 1. Cover — reuse previously generated image; do not regenerate
    plan.push({
      key: 'cover',
      label: 'Front Cover (Page 1)',
      prompt: '',
      status: existingCover ? 'done' : 'pending',
      image: existingCover || undefined,
      canEdit: false,
      regenCount: 0,
      pageType: 'generated',
    });
    
    // 2. Blank page
    plan.push({
      key: 'blank-page',
      label: 'Page 2 - Intentionally Blank',
      prompt: '',
      status: 'done',
      canEdit: false,
      pageType: 'blank',
    });
    
    // 3. Dedication (AI via backend generation)
    plan.push({ 
      key: 'dedication', 
      label: 'Dedication Page (Page 3)', 
      prompt: [
        fullBleed,
        'Create a warm, inviting background perfect for a dedication page.',
        'Use soft, gentle colors and subtle patterns or textures.',
        'The design should be calming and not too busy, suitable for overlaying text.',
        'Include elements like soft clouds, gentle gradients, or subtle nature motifs.',
        `Art style: ${styleDescription}.`,
        'Generate only the background illustration without any text.',
      ].join(' '),
      status: 'pending', 
      canEdit: true, 
      regenCount: 0,
      pageType: 'generated',
      kind: 'dedication',
    });
    
    // 4. Interior pages: alternating text-only and text+image pages
    const genCount = Math.max(0, Number(length || 0));
    console.log('🎨 Generation Plan Debug:', {
      requestedLength: length,
      genCount,
      dbPagesTotal: dbPages.length,
      dbPagesContent: dbPages.filter(p => !p.isTitle && !p.isDedication && p.pageNumber >= 1).length,
      dbPages,
    });
    
    let content = dbPages.filter(p => !p.isTitle && !p.isDedication && p.pageNumber >= 1);
    
    if (content.length === 0) {
      console.error('No story content pages found for the selected series/page count.');
      const errorPlan: GenItem[] = [{
        key: 'error',
        label: 'No story content found for this selection',
        prompt: '',
        status: 'error',
        canEdit: false,
        regenCount: 0,
        pageType: 'static',
        errorMessage: 'No story content available. Try a different page count or series.'
      }];
      setItems(errorPlan);
      return;
    }
    
    console.log('✅ Using DB content pages:', content.length, 'will cycle through for', genCount, 'pages');
    console.log('📖 Content preview:', content.slice(0, 3).map(c => ({ page: c.pageNumber, text: c.text.substring(0, 100) })));
    
    let pageNum = 4;
    let storyIndex = 0;
    
    // Generate interior pages with alternating pattern
    for (let i = 0; i < genCount; i++) {
      const isTextOnly = (i % 2 === 0); // Even indices (0, 2, 4...) are text-only pages
      
      if (isTextOnly) {
        // Text-only page
        const src = content[storyIndex % content.length]; // Use storyIndex and wrap around
        const storyText = getAgeAppropriateText(src);
        plan.push({
          key: `p-${i + 1}`,
          label: `Page ${pageNum} - Story Text`,
          prompt: '',
          status: 'done', // No generation needed for text-only pages
          canEdit: false,
          regenCount: 0,
          storyText: storyText,
          pageType: 'text-only',
        });
        storyIndex++; // Move to next story content
      } else {
        // Text + Image page
        const src = content[storyIndex % content.length]; // Use storyIndex and wrap around
        const desc = applyPH(src.imageDescription || 'An interior scene consistent with the story');
        const storyTextForImage = getAgeAppropriateText(src);
        plan.push({
          key: `p-${i + 1}`,
          label: `Page ${pageNum} - Story Image`,
          prompt: [
            `Art style: ${styleDescription}.`,
            fullBleed,
            `Feature ${applyPH(`{heroName}`) || 'the hero'}; keep likeness from the uploaded photo.`,
            'Vary pose, action, and camera angle; convey motion (running, reaching, turning, jumping, etc.).',
            'If no other people are present in the original image, add a friendly companion character that complements the story. This friend should: match the same art style and character design consistency as the main hero, have age-appropriate proportions similar to the hero, use harmonious colors that fit the overall palette, display a warm and welcoming expression, be positioned naturally in the scene (not crowding the hero), and maintain the same level of detail and rendering quality as the main character.',
            `Scene: ${desc}`,
            'Generate only the illustration without any text or text overlays.',
          ].join(' '),
          status: 'pending',
          canEdit: true,
          regenCount: 0,
          storyText: storyTextForImage,
          pageType: 'generated',
          kind: 'interior',
        });
        storyIndex++; // Move to next story content
      }
      pageNum++;
    }
    
    // 5. Last 3 static pages
    plan.push({
      key: 'last-1',
      label: `Page ${pageNum} - The End`,
      prompt: '',
      status: 'done',
      canEdit: false,
      pageType: 'static',
      staticImagePath: '/page-last-001.png',
      image: '/page-last-001.png',
    });
    pageNum++;
    
    plan.push({
      key: 'last-2',
      label: `Page ${pageNum} - About`,
      prompt: '',
      status: 'done',
      canEdit: false,
      pageType: 'static',
      staticImagePath: '/page-last-002.png',
      image: '/page-last-002.png',
    });
    pageNum++;
    
    plan.push({
      key: 'last-3',
      label: `Page ${pageNum} - Back Cover`,
      prompt: '',
      status: 'done',
      canEdit: false,
      pageType: 'static',
      staticImagePath: '/page-last-003.png',
      image: '/page-last-003.png',
    });
    console.log('📋 Final Generation Plan:', {
      totalPages: plan.length,
      requestedLength: genCount,
      frontMatterPages: 3, // cover, blank, dedication
      interiorPages: genCount,
      backMatterPages: 3, // last 3 static pages
      expectedTotal: 3 + genCount + 3,
      actualTotal: plan.length,
      pagesBreakdown: plan.map(p => ({ key: p.key, label: p.label, pageType: p.pageType }))
    });
    setItems(plan);
    setCurrentIdx(0);
    // Restore custom last-page overlay if present
    try {
      const composed = sessionStorage.getItem('last_page_composed');
      if (composed) {
        setItems((prev) => prev.map((it) => it.key === 'last-1' ? { ...it, image: composed } : it));
      }
    } catch {}
  }, [dbPages, heroName, length, styleKey, themeSlug, existingCover]);

  // Progressive generator
  useEffect(() => {
    // Auto-run strictly one at a time
    if (!autoRun) return;
    const isRunning = items.some((it) => it.status === 'generating');
    if (isRunning) return;
    const idx = items.findIndex((it) => it.status === 'pending' && it.pageType === 'generated');
    if (idx === -1) return;
    generateAt(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, autoRun]);

  // ETA: each page ~1.2 minutes; recompute on completion
  useEffect(() => {
    const generatedItems = items.filter(it => it.pageType === 'generated');
    const doneCount = generatedItems.filter((it) => it.status === 'done').length;
    const total = generatedItems.length || 0;
    const remaining = Math.max(0, total - doneCount);
    const perPageMs = 72_000; // 1.2 minutes per page
    setEtaMs(remaining * perPageMs);
  }, [items]);

  const updateItem = (i: number, patch: Partial<GenItem>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const canRegenerate = (i: number) => {
    const it = items[i];
    if (!it) return false;
    const pageCap = (it.regenCount || 0) < 2;
    const totalCap = regenTotal < 10;
    return pageCap && totalCap;
  };

  const generateAt = async (i: number) => {
    const it = items[i];
    if (!it || it.status === 'generating' || isGenerating) return;
    
    // Dedication uses local generation (special case)
    if (it.key === 'dedication') {
      const isRegen = it.status !== 'pending';
      if (isRegen && !canRegenerate(i)) { 
        alert('Regeneration limits reached (max 2 per page, total 10).'); 
        return; 
      }
      updateItem(i, { status: 'generating' });
      setCurrentGeneratingIndex(i);
      currentGeneratingKeyRef.current = it.key;
      try { sessionStorage.setItem('build_generating_key', it.key); } catch {}
      
      try {
        const img = await composeDedicationImage(applyPH(dedication));
        updateItem(i, { status: 'done', image: img, regenCount: (it.regenCount || 0) + (isRegen ? 1 : 0) });
        if (isRegen) setRegenTotal((t) => t + 1);
        setCurrentIdx(i);
        setCurrentGeneratingIndex(null);
      } catch (e) {
        updateItem(i, { status: 'error' });
        setCurrentGeneratingIndex(null);
      }
      return;
    }
    
    if (it.key === 'cover' || it.canEdit === false) {
      return; // never regenerate cover
    }
    
    // Others via queue system
    if (!originalImage) { alert('Missing uploaded photo for likeness.'); return; }
    
    const isRegen = it.status !== 'pending';
    if (isRegen && !canRegenerate(i)) { alert('Regeneration limits reached (max 2 per page, total 10).'); return; }
    
    // Set current generating index for progress tracking
    setCurrentGeneratingIndex(i);
    currentGeneratingKeyRef.current = it.key;
    try { sessionStorage.setItem('build_generating_key', it.key); } catch {}
    updateItem(i, { status: 'generating', progress: 0, message: 'Queueing job...' });
    
    try {
      const request = {
        heroName: heroName || 'Hero',
        themeId: themeSlug || undefined,
        storyId,
        originalImageBase64: originalImage,
        ageGroup: age,
        length,
        styleKey,
        kind: (it.kind || 'interior') as 'cover' | 'interior' | 'dedication',
        coverPromptOverride: it.key !== 'cover' ? it.prompt : undefined,
        storyText: it.storyText
      };
      
      await generateImage(request);
      
      // Update regeneration count
      if (isRegen) {
        updateItem(i, { regenCount: (it.regenCount || 0) + 1 });
        setRegenTotal((t) => t + 1);
      }
    } catch (e) {
      updateItem(i, { status: 'error', errorMessage: e instanceof Error ? e.message : 'Generation failed' });
      setCurrentGeneratingIndex(null);
    }
  };

  // dedication local compositor removed (using preview API dedicated path instead)

  const allDone = items.length > 0 && items.filter(it => it.pageType === 'generated').every(it => it.status === 'done');

  const printableRef = useRef<HTMLDivElement | null>(null);

  const handlePrintPdf = () => {
    // Render printable area then trigger print dialog; user can Save as PDF
    setPrinting(true);
    setTimeout(() => { window.print(); setPrinting(false); }, 50);
  };

  // Export a full-bleed PDF (one page per book page)
  const exportPdf = async () => {
    setExportingPdf(true);
    try {
      const { exportBookPdf } = await import('@/lib/pdf/export');
      await exportBookPdf(items as any);
    } catch (e) {
      console.error('Export PDF failed:', e);
      alert('Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Build book spreads for viewer - match PDF layout exactly
  const spreads = useMemo(() => {
    const arr: Array<{ left?: { type: 'blank'|'text'|'image'; text?: string; src?: string }, right?: { type: 'blank'|'text'|'image'; text?: string; src?: string }, singleRight?: boolean }>= [];
    
    // 1) Cover only (single right page)
    const coverItem = items.find(item => item.key === 'cover');
    if (coverItem?.image) {
      arr.push({ right: { type: 'image', src: coverItem.image }, singleRight: true });
    }
    
    // 2) Process remaining items in pairs for side-by-side layout (matching PDF logic)
    const remainingItems = items.slice(1); // Skip cover
    const lastThreeItems = remainingItems.slice(-3); // Last 3 static pages
    const contentItems = remainingItems.slice(0, -3); // Everything except last 3
    
    // Process content items in pairs
    for (let i = 0; i < contentItems.length; i += 2) {
      const leftItem = contentItems[i];
      const rightItem = contentItems[i + 1];
      
      // Left side
      let left: { type: 'blank'|'text'|'image'; text?: string; src?: string } | undefined;
      if (leftItem) {
        if (leftItem.pageType === 'blank') {
          left = { type: 'blank' };
        } else if (leftItem.pageType === 'text-only') {
          left = { type: 'text', text: leftItem.storyText || '' };
        } else if (leftItem.image) {
          left = { type: 'image', src: leftItem.image || leftItem.staticImagePath };
        }
      }
      
      // Right side
      let right: { type: 'blank'|'text'|'image'; text?: string; src?: string } | undefined;
      if (rightItem) {
        if (rightItem.pageType === 'blank') {
          right = { type: 'blank' };
        } else if (rightItem.pageType === 'text-only') {
          right = { type: 'text', text: rightItem.storyText || '' };
        } else if (rightItem.image) {
          right = { type: 'image', src: rightItem.image || rightItem.staticImagePath, text: rightItem.storyText };
        }
      }
      
      arr.push({ left, right });
    }
    
    // 3) Last 3 pages as individual single pages (matching PDF behavior)
    for (const item of lastThreeItems) {
      if (item.pageType === 'static' && item.image) {
        arr.push({ right: { type: 'image', src: item.image || item.staticImagePath }, singleRight: true });
      }
    }
    
    return arr;
  }, [items]);

  const [spreadIdx, setSpreadIdx] = useState(0);
  useEffect(() => { if (viewerOpen) setSpreadIdx(0); }, [viewerOpen]);

  const renderPage = (side: 'left'|'right', page?: { type: 'blank'|'text'|'image'; text?: string; src?: string }) => {
    return (
      <div className={`relative w-full aspect-square bg-white border rounded overflow-hidden flex items-center justify-center ${side==='left'?'':'order-2'}`}>
        {page?.type === 'blank' && (
          <div className="w-full h-full bg-white flex items-center justify-center text-gray-400 italic text-sm">
            This page intentionally left blank
          </div>
        )}
        {page?.type === 'text' && (
          <div className="p-8 w-full h-full flex items-center justify-center">
            <div className="text-center whitespace-pre-wrap text-2xl leading-relaxed text-gray-800 font-medium max-w-full" style={{ fontFamily: 'Comic Sans MS, cursive, fantasy' }}>
              {page.text || ''}
            </div>
          </div>
        )}
        {page?.type === 'image' && (
          <div className="w-full h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.src || ''} alt="page" className="w-full h-full object-cover" />
            {/* Children's book style text overlay for right-side images */}
            {side==='right' && page.text && page.text.trim() && (
              <div className="absolute inset-x-4 bottom-4">
                <div className="relative">
                  {/* Border/shadow effect */}
                  <div className="absolute inset-0 bg-gray-300 rounded-xl transform translate-x-1 translate-y-1"></div>
                  {/* Main text box */}
                  <div className="relative bg-white/95 border-4 border-gray-200 rounded-xl px-4 py-3 shadow-lg">
                    <div className="text-center text-gray-800 text-sm font-medium leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Comic Sans MS, cursive, fantasy' }}>
                      {page.text}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      <ProgressSteps mode={mode} currentStep={4} />
      <div className="text-center">
        <h1 className="text-2xl font-bold">Building Your Book</h1>
        <p className="text-sm text-muted-foreground">We’re creating each page one by one. You can tweak prompts and regenerate.</p>
      </div>

      {/* Progress bar + ETA */}
      <div className="border rounded-md p-3 bg-muted/30">
        {(() => {
          const generatedItems = items.filter(it => it.pageType === 'generated');
          const total = generatedItems.length || 1;
          const done = generatedItems.filter(i=>i.status==='done').length;
          const percent = Math.round((done/total)*100);
          const secs = Math.ceil(etaMs/1000);
          const mm = Math.floor(secs/60).toString();
          const ss = (secs%60).toString().padStart(2,'0');
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{done}/{total} images generated</span>
                <span>ETA ~ {secs>0 ? `${mm}:${ss}` : '—'}</span>
              </div>
              <div className="w-full h-2 rounded bg-background overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: current image */}
        <Card>
          <CardHeader><CardTitle>{items[currentIdx]?.label || 'Current Page'}</CardTitle></CardHeader>
          <CardContent>
            <div className="aspect-square bg-muted rounded overflow-hidden flex items-center justify-center">
              {items[currentIdx]?.pageType === 'blank' ? (
                <div className="w-full h-full bg-white flex items-center justify-center text-neutral-400 italic text-sm">
                  This page intentionally left blank
                </div>
              ) : items[currentIdx]?.pageType === 'text-only' ? (
                <div className="w-full h-full bg-white p-8 flex items-center justify-center">
                  <div className="text-center whitespace-pre-wrap text-2xl leading-relaxed text-gray-800 font-medium" style={{ fontFamily: 'Comic Sans MS, cursive, fantasy' }}>
                    {items[currentIdx]?.storyText || ''}
                  </div>
                </div>
              ) : items[currentIdx]?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={items[currentIdx].image} alt={items[currentIdx].label} className="w-full h-full object-cover" />
              ) : (
                <div className="text-muted-foreground text-sm">
                  {items[currentIdx]?.status === 'generating' ? (
                    <div className="space-y-1">
                      <div>Generating… {items[currentIdx]?.progress || 0}%</div>
                      {items[currentIdx]?.message && (
                        <div className="text-xs">{items[currentIdx]?.message}</div>
                      )}
                    </div>
                  ) : items[currentIdx]?.status === 'error' ? (
                    <div className="text-red-500">
                      {items[currentIdx]?.errorMessage || 'Generation failed'}
                    </div>
                  ) : 'No image yet'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right: prompt + controls */}
        <Card>
          <CardHeader><CardTitle>
            {items[currentIdx]?.pageType === 'blank' || items[currentIdx]?.pageType === 'text-only' || items[currentIdx]?.pageType === 'static' 
              ? 'Page Details' 
              : 'Prompt'}
          </CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {items[currentIdx]?.pageType === 'blank' ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  This page is intentionally left blank, as is standard in professional book printing.
                </div>
              </div>
            ) : items[currentIdx]?.pageType === 'text-only' ? (
              <div className="space-y-2">
                <Label>Story Text</Label>
                <div className="p-3 border rounded bg-background whitespace-pre-wrap max-h-64 overflow-auto">
                  {items[currentIdx]?.storyText || ''}
                </div>
                <div className="text-xs text-muted-foreground">
                  This is a text-only page. The corresponding image will appear on the next page.
                </div>
              </div>
            ) : items[currentIdx]?.pageType === 'static' ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">This is a pre-designed page that will be included in all books.</div>
                <div className="p-2 border rounded bg-muted text-xs">Static image: {items[currentIdx]?.staticImagePath}</div>
                {items[currentIdx]?.key === 'last-1' && (
                  <div className="space-y-2">
                    <Label>Custom dedication image (optional)</Label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          try {
                            const composed = await composeLastOverlayImage(String(reader.result));
                            updateItem(currentIdx, { image: composed });
                            try { 
                              sessionStorage.setItem('last_page_overlay', String(reader.result));
                              sessionStorage.setItem('last_page_composed', composed);
                            } catch {}
                          } catch (err) {
                            console.error('Failed composing last page overlay', err);
                            alert('Failed to compose dedication image');
                          }
                        };
                        reader.readAsDataURL(f);
                      }}
                    />
                    <div className="text-xs text-muted-foreground">We will center your image at 50% height (keeping its aspect ratio) with a 20px white border on the background.</div>
                  </div>
                )}
              </div>
            ) : items[currentIdx]?.key === 'dedication' ? (
              <div className="space-y-2">
                <Label>Dedication message</Label>
                <Textarea 
                  value={dedication} 
                  onChange={(e) => setDedication(e.target.value)} 
                  rows={4} 
                  placeholder="A special message for your book..."
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => generateAt(currentIdx)} 
                    disabled={items[currentIdx].status === 'generating'}
                  >
                    {items[currentIdx].status === 'done' ? 'Regenerate' : 'Generate'} dedication
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  This will create a dedication page with your message overlaid on a decorative background.
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Textarea value={items[currentIdx]?.prompt || ''} onChange={(e)=> updateItem(currentIdx, { prompt: e.target.value })} rows={8} />
                {items[currentIdx]?.storyText && (
                  <div className="text-xs text-muted-foreground">
                    <div className="font-medium mb-1">Story text</div>
                    <div className="p-2 border rounded bg-background whitespace-pre-wrap max-h-32 overflow-auto">{items[currentIdx]?.storyText}</div>
                  </div>
                )}
                <div className="flex gap-2 items-center">
                  <Button onClick={()=> generateAt(currentIdx)} disabled={items[currentIdx]?.status==='generating' || items[currentIdx]?.canEdit===false || (items[currentIdx]?.status!=='pending' && !canRegenerate(currentIdx))}>
                    {items[currentIdx]?.status==='pending' ? 'Generate' : 'Regenerate'}
                  </Button>
                  <label className="text-sm flex items-center gap-2">
                    <input type="checkbox" checked={autoRun} onChange={(e)=> setAutoRun(e.target.checked)} /> Auto‑run next pages
                  </label>
                </div>
                {items[currentIdx]?.status!=='pending' && (
                  <div className="text-xs text-muted-foreground">
                    Regens used: {(items[currentIdx]?.regenCount||0)}/2 • Total: {regenTotal}/10
                  </div>
                )}
              </div>
            )}

            <div className="border rounded p-2 max-h-64 overflow-auto text-sm">
              {items.map((it, idx) => (
                <div key={it.key} className={`flex items-center justify-between py-1 px-1 rounded ${idx===currentIdx?'bg-muted':''}`}>
                  <div className="truncate max-w-[60%]"><span className="text-muted-foreground">{it.label}</span></div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">
                      {it.status === 'generating' && it.progress ? `${it.status} (${it.progress}%)` : it.status}
                    </span>
                    <Button size="sm" variant="outline" onClick={()=> setCurrentIdx(idx)}>Open</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {items.filter(i=>i.pageType==='generated' && i.status==='done').length}/{items.filter(i=>i.pageType==='generated').length} images generated • Total {items.length} pages
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Button variant="outline" onClick={()=> setViewerOpen(true)} disabled={spreads.length===0}>View Book</Button>
          <Button onClick={exportPdf} disabled={!allDone || exportingPdf}>
            {exportingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              'Export PDF'
            )}
          </Button>
        </div>
      </div>

      {/* Full book viewer: 2-page spreads like a real book */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="w-auto max-h-[90vh] overflow-auto" style={{ maxWidth: 'min(96vw, 92vh)' }}>
          <DialogHeader>
            <DialogTitle>Your Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Spread viewport */}
            <div className="mx-auto flex items-center justify-center gap-2">
              {/* Left page hidden when singleRight spread */}
              {!spreads[spreadIdx]?.singleRight && renderPage('left', spreads[spreadIdx]?.left)}
              {renderPage('right', spreads[spreadIdx]?.right)}
            </div>
            {/* Controls */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <Button size="sm" variant="outline" onClick={() => setSpreadIdx((i)=> Math.max(0, i-1))} disabled={spreadIdx<=0}>Previous</Button>
              <div>Spread {spreadIdx+1} of {spreads.length}</div>
              <Button size="sm" variant="outline" onClick={() => setSpreadIdx((i)=> Math.min(spreads.length-1, i+1))} disabled={spreadIdx>=spreads.length-1}>Next</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden printable area */}
      <div style={{ display: printing ? 'block' : 'none' }}>
        <div ref={printableRef} className="print-area">
          {items.map((it) => (
            <div key={it.key} style={{ pageBreakAfter: 'always' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {it.image ? <img src={it.image} alt={it.label} style={{ width: '100%', height: 'auto' }} /> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
