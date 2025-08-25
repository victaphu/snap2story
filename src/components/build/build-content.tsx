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
import { supabase } from '@/lib/services/supabase-client';
import { composeDedicationImage } from '@/lib/dedication';

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
  const [dedication, setDedication] = useState('A special book made with love.');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [regenTotal, setRegenTotal] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [etaMs, setEtaMs] = useState<number>(0);
  const [existingCover, setExistingCover] = useState<string>('');

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
    } catch {}
  }, []);

  const storyId = useMemo(() => {
    // Prefer the explicit selection saved from ChooseThemeContent
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
  }, [themeSlug]);

  useEffect(() => {
    const run = async () => {
      if (!storyId) return;
      const ageNum = parseInt((age.split('-')[0] || '5'), 10);
      const { data, error } = await supabase.rpc('get_story_pages_full_for_age', { p_story_id: storyId, p_age: ageNum });
      if (!error && Array.isArray(data)) {
        const rows = data.map((r: any) => ({
          pageNumber: Number(r.page_number),
          text: String(r.text || ''),
          imageDescription: String(r.image_description || ''),
          isTitle: Boolean(r.is_title),
          isDedication: Boolean(r.is_dedication),
          raw: r.raw,
        }));
        setDbPages(rows);
      }
    };
    run();
  }, [storyId, age]);

  const styleMap: Record<string, string> = {
    'watercolor': 'Soft Watercolor Storybook: Create artwork in a hand-painted watercolor style, with soft pastels, gentle gradients, and textured paper effects. Keep the look dreamy, light, and calm, with rounded, friendly character designs and simple, uncluttered backgrounds for a soothing, storybook feel. Ensure consistent character proportions, colors, and details across every image.',
    'bright-cartoon': 'Bright Cartoon (Bluey-Inspired): Produce artwork in a bright, clean children\'s cartoon style inspired by Bluey, with simple rounded shapes, bold and vibrant colors, minimal shading, and happy, approachable character expressions. Use clean, thick outlines and maintain consistent character sizes, outfits, and colors in every image.',
    'paper-collage': 'Paper-Cut Collage Style: Create a paper-cut collage art style with layered textures, visible edges, and bright but slightly organic color tones. Each element should look handcrafted from textured paper, with soft shadows adding depth and dimension. Ensure character features and color palettes stay consistent across all pages.',
    'fairytale': 'Fantasy Fairytale Style: Generate illustrations in a classic fairytale style, with detailed but soft linework, whimsical backgrounds, and a touch of magic in the color palette. Use subtle glowing highlights, soft shading, and ornate but approachable designs to make every page feel like a magical adventure. Keep characters visually consistent across all pages.',
    'crayon-marker': 'Crayon and Marker Sketch: Create images in a childlike crayon and marker sketch style, with bold, imperfect lines, playful textures, and bright primary colors. The style should feel spontaneous and fun, as if drawn by a creative child, while keeping characters clear and expressive. Ensure characters stay consistent throughout the series.',
    'anime-chibi': 'Anime Chibi / Ghibli-Inspired: Use rounded, chibi-like proportions with big, expressive eyes, soft palettes, gentle shading, and cozy backgrounds. Keep designs adorable and heartwarming, with consistent character proportions, colors, and simple, readable shapes.',
    // Legacy compatibility
    'childrens-cartoon': 'Bright Cartoon (Bluey-Inspired): Produce artwork in a bright, clean children\'s cartoon style inspired by Bluey, with simple rounded shapes, bold and vibrant colors, minimal shading, and happy, approachable character expressions. Use clean, thick outlines and maintain consistent character sizes, outfits, and colors in every image.',
    'anime': 'Anime Chibi / Ghibli-Inspired: Use rounded, chibi-like proportions with big, expressive eyes, soft palettes, gentle shading, and cozy backgrounds. Keep designs adorable and heartwarming, with consistent character proportions, colors, and simple, readable shapes.',
    'comic-book': 'Fantasy Fairytale Style: Generate illustrations in a classic fairytale style, with detailed but soft linework, whimsical backgrounds, and a touch of magic in the color palette. Use subtle glowing highlights, soft shading, and ornate but approachable designs to make every page feel like a magical adventure. Keep characters visually consistent across all pages.',
  };

  const fullBleed = 'Generate a single full‑bleed, edge‑to‑edge page image (no borders, frames, margins, mockups, UI, or text).';

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

  // Build generation plan once pages are loaded
  useEffect(() => {
    if (dbPages.length === 0) return;
    const plan: GenItem[] = [];
    
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
    
    // 3. Dedication (AI via special call)
    plan.push({ 
      key: 'dedication', 
      label: 'Dedication Page (Page 3)', 
      prompt: '(dedication)', 
      status: 'pending', 
      canEdit: true, 
      regenCount: 0,
      pageType: 'generated',
    });
    
    // 4. Interior pages: alternating text and images
    const content = dbPages.filter(p => !p.isTitle && !p.isDedication && p.pageNumber >= 1);
    let pageNum = 4;
    
    for (let i = 0; i < content.length; i++) {
      // Text-only page (left side) - use age-appropriate text
      const storyTxt = getAgeAppropriateText(content[i]);
      plan.push({
        key: `text-${i+1}`,
        label: `Page ${pageNum} - Story Text`,
        prompt: '',
        status: 'done',
        canEdit: false,
        pageType: 'text-only',
        storyText: storyTxt,
      });
      pageNum++;
      
      i = i + 1;
      // Image page (right side)
      const desc = applyPH(content[i].imageDescription || 'An interior scene consistent with the story');
      const storyTextForImage = getAgeAppropriateText(content[i]); // Get text from the current page
      plan.push({
        key: `p-${i+1}`,
        label: `Page ${pageNum} - Story Image`,
        prompt: [
          fullBleed,
          `Feature ${applyPH(`{heroName}`) || 'the hero'}; keep likeness from the uploaded photo.`,
          'Vary pose, action, and camera angle; convey motion (running, reaching, turning, jumping, etc.).',
          'If no other people are present in the original image, add a friendly companion character that complements the story. This friend should: match the same art style and character design consistency as the main hero, have age-appropriate proportions similar to the hero, use harmonious colors that fit the overall palette, display a warm and welcoming expression, be positioned naturally in the scene (not crowding the hero), and maintain the same level of detail and rendering quality as the main character.',
          `Scene: ${desc}`,
          `Art style: ${styleMap[styleKey] || 'Bright storybook'}.`,
          'Generate only the illustration without any text or text overlays.',
        ].join(' '),
        status: 'pending',
        canEdit: true,
        regenCount: 0,
        storyText: storyTextForImage,
        pageType: 'generated',
      });
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
    console.log('plan loaded', plan, content);
    setItems(plan);
    setCurrentIdx(0);
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

  // Track start time when first item begins, update ETA every second
  useEffect(() => {
    const generatedItems = items.filter(it => it.pageType === 'generated');
    const anyGen = generatedItems.some((it) => it.status === 'generating');
    const doneCount = generatedItems.filter((it) => it.status === 'done').length;
    const total = generatedItems.length || 1;
    if ((anyGen || doneCount > 0) && !startedAt) setStartedAt(Date.now());
    if (doneCount >= total) { setEtaMs(0); return; }
    const handle = setInterval(() => {
      const now = Date.now();
      const elapsed = startedAt ? now - startedAt : 0;
      const avgPer = doneCount > 0 ? elapsed / doneCount : 78_000; // ~1.3 min default until first completes
      const remaining = Math.max(0, total - doneCount);
      setEtaMs(Math.ceil(avgPer * remaining));
    }, 1000);
    return () => clearInterval(handle);
  }, [items, startedAt]);

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
    if (!it || it.status === 'generating') return;
    // Dedication via preview endpoint (special branch)
    if (it.key === 'dedication') {
      const isRegen = it.status !== 'pending';
      if (isRegen && !canRegenerate(i)) { alert('Regeneration limits reached (max 2 per page, total 10).'); return; }
      updateItem(i, { status: 'generating' });
      try {
        const img = await composeDedicationImage(applyPH(dedication));
        updateItem(i, { status: 'done', image: img, regenCount: (it.regenCount || 0) + (isRegen ? 1 : 0) });
        if (isRegen) setRegenTotal((t) => t + 1);
        setCurrentIdx(i);
      } catch (e) {
        updateItem(i, { status: 'error' });
      }
      return;
    }
    if (it.key === 'cover' || it.canEdit === false) {
      return; // never regenerate cover
    }
    // Others via preview endpoint (ensures consistent pipeline)
    if (!originalImage) { alert('Missing uploaded photo for likeness.'); return; }
    // Determine if this call is a regeneration
    const isRegen = it.status !== 'pending';
    if (isRegen && !canRegenerate(i)) { alert('Regeneration limits reached (max 2 per page, total 10).'); return; }
    updateItem(i, { status: 'generating' });
    try {
      const body: any = {
        heroName: heroName || 'Hero',
        themeId: themeSlug || undefined,
        storyId,
        originalImageBase64: originalImage,
        ageGroup: age,
        length,
        styleKey,
        kind: it.key === 'cover' ? 'cover' : 'interior',
      };
      // Use page-specific scene as override for interior pages
      if (it.key !== 'cover') body.coverPromptOverride = applyPH(it.prompt);
      const res = await fetch('/api/generate-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok || !data?.coverImage) throw new Error(data?.error || 'Failed');
      updateItem(i, { status: 'done', image: String(data.coverImage), regenCount: (it.regenCount || 0) + (isRegen ? 1 : 0) });
      if (isRegen) setRegenTotal((t) => t + 1);
      setCurrentIdx(i);
    } catch (e) {
      updateItem(i, { status: 'error' });
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
    try {
      // Lazy-load pdf-lib from CDN if not present
      const ensurePdfLib = () => new Promise<any>((resolve, reject) => {
        if ((window as any).PDFLib) return resolve((window as any).PDFLib);
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js';
        s.async = true;
        s.onload = () => resolve((window as any).PDFLib);
        s.onerror = () => reject(new Error('Failed to load PDF library'));
        document.body.appendChild(s);
      });
      const PDFLib = await ensurePdfLib();
      const { PDFDocument, StandardFonts, rgb } = PDFLib;
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pageSize = 2048; // square, full-bleed

      const fetchBytes = async (src: string): Promise<Uint8Array> => {
        if (!src) return new Uint8Array();
        if (src.startsWith('data:')) {
          const b64 = src.split(',')[1] || '';
          const bin = atob(b64);
          const arr = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
          return arr;
        }
        
        // For external URLs (like Qwen CDN), proxy through our server to avoid CORS
        if (src.startsWith('http')) {
          try {
            const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;
            const res = await fetch(proxyUrl);
            if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
            const ab = await res.arrayBuffer();
            return new Uint8Array(ab);
          } catch (error) {
            console.warn('Failed to fetch external image, skipping:', src, error);
            return new Uint8Array();
          }
        }
        
        // For local URLs
        try {
          const res = await fetch(src);
          const ab = await res.arrayBuffer();
          return new Uint8Array(ab);
        } catch (error) {
          console.warn('Failed to fetch local image, skipping:', src, error);
          return new Uint8Array();
        }
      };

      const drawImageFullBleed = async (src: string, textOverlay?: string) => {
        const bytes = await fetchBytes(src);
        if (!bytes.length) { await drawTextPage(textOverlay || ''); return; }
        let img;
        try { img = await pdfDoc.embedPng(bytes); } catch { img = await pdfDoc.embedJpg(bytes); }
        const page = pdfDoc.addPage([pageSize, pageSize]);
        page.drawImage(img, { x: 0, y: 0, width: pageSize, height: pageSize });
        
        if (textOverlay && textOverlay.trim()) {
          // Children's book text overlay styling (matching text-overlay.ts)
          const outerPadding = 100; // margin from page edge
          const innerPadding = 32; // padding inside text box
          const borderWidth = 8;
          const cornerRadius = 24; // scaled for PDF
          const fontSize = 56;
          const lineHeight = 1.3;
          
          const maxTextWidth = pageSize * 0.9 - (outerPadding * 2) - (innerPadding * 2);
          
          // Word wrap the text
          const words = textOverlay.split(/\s+/);
          const lines: string[] = [];
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (font.widthOfTextAtSize(testLine, fontSize) > maxTextWidth && currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          if (currentLine) lines.push(currentLine);
          
          // Calculate text box dimensions
          const textHeight = lines.length * (fontSize * lineHeight);
          const boxWidth = pageSize * 0.9 - (outerPadding * 2);
          const boxHeight = textHeight + (innerPadding * 2);
          
          // Position at bottom of page
          const boxX = (pageSize - boxWidth) / 2;
          const boxY = outerPadding;
          
          // Draw outer border (children's book border color: light gray)
          page.drawRectangle({
            x: boxX - borderWidth,
            y: boxY - borderWidth,
            width: boxWidth + (borderWidth * 2),
            height: boxHeight + (borderWidth * 2),
            color: rgb(0.886, 0.91, 0.941), // #e2e8f0 - border color
          });
          
          // Draw inner background (semi-transparent white)
          page.drawRectangle({
            x: boxX,
            y: boxY,
            width: boxWidth,
            height: boxHeight,
            color: rgb(0.98, 0.98, 0.98), // Very light background for PDF
          });
          
          // Draw text lines (children's book text color)
          const textStartY = boxY + boxHeight - innerPadding - (fontSize * 0.8);
          const textCenterX = boxX + boxWidth / 2;
          
          let currentY = textStartY;
          for (const line of lines) {
            const textWidth = font.widthOfTextAtSize(line, fontSize);
            const textX = textCenterX - textWidth / 2;
            page.drawText(line, {
              x: textX,
              y: currentY,
              size: fontSize,
              font,
              color: rgb(0.176, 0.216, 0.282), // #2d3748 - children's book text color
            });
            currentY -= fontSize * lineHeight;
          }
        }
      };

      const drawTextPage = async (txt: string) => {
        const page = pdfDoc.addPage([pageSize, pageSize]);
        const padding = 160;
        const boxWidth = pageSize - padding * 2;
        const words = (txt || '').split(/\s+/);
        const lines: string[] = [];
        const fontSize = 64;
        let line = '';
        for (const w of words) {
          const test = line ? line + ' ' + w : w;
          if (font.widthOfTextAtSize(test, fontSize) > boxWidth) { if (line) lines.push(line); line = w; }
          else line = test;
        }
        if (line) lines.push(line);
        const totalHeight = lines.length * (fontSize * 1.35);
        let y = (pageSize - totalHeight) / 2 + (lines.length-1)*(fontSize*1.35);
        for (const ln of lines) {
          const tw = font.widthOfTextAtSize(ln, fontSize);
          const x = (pageSize - tw) / 2;
          page.drawText(ln, { x, y, size: fontSize, font, color: rgb(0.1,0.1,0.12) });
          y -= fontSize * 1.35;
        }
      };

      // Generate PDF pages in exact same order as build page items
      for (const item of items) {
        if (item.pageType === 'blank') {
          await drawTextPage(''); // intentionally blank page
        } else if (item.pageType === 'text-only') {
          await drawTextPage(item.storyText || '');
        } else if (item.pageType === 'generated') {
          await drawImageFullBleed(item.image || '', item.storyText || '');
        } else if (item.pageType === 'static') {
          await drawImageFullBleed(item.staticImagePath || item.image || '');
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(items.find(i=>i.key==='cover')?.label || 'book')}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export PDF failed:', e);
      alert('Failed to export PDF');
    }
  };

  // Build book spreads for viewer
  const spreads = useMemo(() => {
    const arr: Array<{ left?: { type: 'blank'|'text'|'image'; text?: string; src?: string }, right?: { type: 'blank'|'text'|'image'; text?: string; src?: string }, singleRight?: boolean }>= [];
    const cover = existingCover || items.find(i=>i.key==='cover')?.image || '';
    const dedicationImg = items.find(i=>i.key==='dedication')?.image || '';
    const contentImgs = items.filter(i=>i.key!=='cover' && i.key!=='dedication');
    // 1) Cover only (right page only)
    arr.push({ right: { type: 'image', src: cover }, singleRight: true });
    // 2) Pages 2-3: left blank, right dedication
    arr.push({ left: { type: 'blank' }, right: { type: 'image', src: dedicationImg } });
    // 3) Content spreads: for each generated image, left text (from same item), right image with overlaid text (we overlay in UI)
    for (const it of contentImgs) {
      arr.push({ left: { type: 'text', text: it.storyText || '' }, right: { type: 'image', src: it.image || '', text: it.storyText || '' } as any });
    }
    // 4) Last two static pages as a spread
    arr.push({ left: { type: 'image', src: '/page-last-001.png' }, right: { type: 'image', src: '/page-last-002.png' } });
    // 5) Final back cover (single right page)
    arr.push({ right: { type: 'image', src: '/page-last-003.png' }, singleRight: true });
    return arr;
  }, [items, existingCover]);

  const [spreadIdx, setSpreadIdx] = useState(0);
  useEffect(() => { if (viewerOpen) setSpreadIdx(0); }, [viewerOpen]);

  const renderPage = (side: 'left'|'right', page?: { type: 'blank'|'text'|'image'; text?: string; src?: string }) => {
    return (
      <div className={`relative w-full aspect-square bg-white border rounded overflow-hidden flex items-center justify-center ${side==='left'?'':'order-2'}`}>
        {page?.type === 'blank' && (
          <div className="w-full h-full bg-white flex items-center justify-center text-neutral-400 italic text-xs">This page intentionally left blank</div>
        )}
        {page?.type === 'text' && (
          <div className="p-6 w-full h-full flex items-center justify-center">
            <div className="text-center whitespace-pre-wrap text-base leading-relaxed text-neutral-800">{page.text || ''}</div>
          </div>
        )}
        {page?.type === 'image' && (
          <div className="w-full h-full relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={page.src || ''} alt="page" className="w-full h-full object-cover" />
            {/* If there is text on the right image, overlay near bottom center */}
            {side==='right' && page.text && (
              <div className="absolute inset-x-6 bottom-6 bg-white/85 text-neutral-900 rounded px-4 py-2 text-sm text-center shadow-sm whitespace-pre-wrap">
                {page.text}
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
                  <div className="text-center whitespace-pre-wrap text-base leading-relaxed text-neutral-800">
                    {items[currentIdx]?.storyText || ''}
                  </div>
                </div>
              ) : items[currentIdx]?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={items[currentIdx].image} alt={items[currentIdx].label} className="w-full h-full object-cover" />
              ) : (
                <div className="text-muted-foreground text-sm">{items[currentIdx]?.status === 'generating' ? 'Generating…' : 'No image yet'}</div>
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
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  This is a pre-designed page that will be included in all books.
                </div>
                <div className="p-2 border rounded bg-muted text-xs">
                  Static image: {items[currentIdx]?.staticImagePath}
                </div>
              </div>
            ) : items[currentIdx]?.key === 'dedication' ? (
              <div className="space-y-2">
                <Label>Dedication message</Label>
                <Textarea value={dedication} onChange={(e)=> setDedication(e.target.value)} rows={4} />
                <div className="flex gap-2">
                  <Button onClick={()=> generateAt(currentIdx)} disabled={items[currentIdx].status==='generating'}>Generate dedication</Button>
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
                    <span className="text-xs">{it.status}</span>
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
          <Button variant="outline" onClick={()=> setViewerOpen(true)} disabled={!allDone}>View Book</Button>
          <Button onClick={exportPdf} disabled={!allDone}>Export PDF</Button>
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
