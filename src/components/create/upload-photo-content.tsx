'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useImageGeneration } from '@/lib/hooks/useImageGeneration';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { LIMITS, THEMES, AGE_GROUPS } from '@/lib/constants';
import { ProgressSteps } from './progress-steps';
import { usePreview } from '@/contexts/preview-context';
import { compressImage, compressBase64Image, getBase64Size, padBase64ToSquare } from '@/lib/image-utils';
import { PlaceholdersForm } from './placeholders-form';
import type { TemplatePlaceholder } from '@/lib/types/placeholders';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReconnectionBanner } from '@/components/ui/reconnection-banner';
import { supabase } from '@/lib/services/supabase-client';

export function UploadPhotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPreviewData } = usePreview();
  const mode = searchParams.get('mode') || 'ai-assisted';
  const theme = searchParams.get('theme');
  // Derive storyId from query param or theme slug (so we can fetch placeholders early)
  const storyId = (() => {
    const sid = searchParams.get('storyId');
    if (sid) return sid;
    const themeSlug = searchParams.get('theme');
    if (!themeSlug) return undefined;
    const map: Record<string, string> = {
      adventure: 'adventure_flexible_multiage',
      friendship: 'friendship_flexible_multiage',
      family: 'family_flexible_multiage',
      dreams: 'dreams_flexible_multiage',
    };
    return map[themeSlug];
  })();
  const ageParam = searchParams.get('age') || undefined;
  const lengthParam = searchParams.get('length') || undefined;
  const [ageGroup, setAgeGroup] = useState<string>(ageParam || (AGE_GROUPS[3]?.id || '5-6'));
  const [bookLength, setBookLength] = useState<number>(lengthParam ? Number(lengthParam) : 10);
  const [seriesKey, setSeriesKey] = useState<string | null>(null);
  
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImageUrl, setTitleImageUrl] = useState<string>('');
  const [heroName, setHeroName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [styleKey, setStyleKey] = useState<'watercolor'|'bright-cartoon'|'paper-collage'|'fairytale'|'crayon-marker'|'anime-chibi'>('bright-cartoon');
  const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});
  const [placeholderDefs, setPlaceholderDefs] = useState<TemplatePlaceholder[]>([]);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle');
  const [generatedCoverImage, setGeneratedCoverImage] = useState<string>('');
  const [queueProgress, setQueueProgress] = useState<number>(0);
  const [queueMessage, setQueueMessage] = useState<string>('');

  // Initialize image generation hook for queue system
  const { generateImage, currentJob, isGenerating: isQueueGenerating } = useImageGeneration({
    useWebSocket: true,
    onProgress: (progress) => {
      console.log('📊 Upload Photo - Progress:', progress);
      setGeneratingStatus('processing');
      setQueueProgress(progress.progress);
      setQueueMessage(progress.message);
      
      // Keep the main generating state active during processing
      if (!isGenerating) {
        setIsGenerating(true);
      }
      
      // Show progress dialog if not already open
      if (!progressOpen) {
        setProgressOpen(true);
      }
    },
    onCompleted: (result) => {
      console.log('✅ Upload Photo - Completed:', result);
      setGeneratingStatus('completed');
      setQueueProgress(100);
      setQueueMessage('Image generation completed!');
      
      // Complete the funny timer as well
      setProgress(100);
      setProgressMsg('🎉 All done!');
      
      if (result.imageUrl) {
        // Handle the completed image
        handleQueueImageCompleted(result.imageUrl);
      }
      
      // Keep isGenerating true until navigation completes
    },
    onFailed: (error) => {
      console.error('❌ Upload Photo - Failed:', error);
      setGeneratingStatus('failed');
      setQueueMessage(error.error || 'Image generation failed');
      setIsGenerating(false);
      toast.error('Image generation failed: ' + (error.error || 'Unknown error'));
    }
  });
  const [originalImageBase64, setOriginalImageBase64] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [showReconnectionBanner, setShowReconnectionBanner] = useState(false);
  const hasShownReconnectionRef = useRef(false);
  const PROGRESS_WORDS = [
    'Sharpening story pencils…',
    'Warming watercolor palette…',
    'Training unicorns to smile…',
    'Ironing tiny capes…',
    'Teaching clouds to be fluffier…',
    'Sorting sprinkles by color…',
    'Practicing giggles…',
    'Whispering to the moon…',
    'Polishing star stickers…',
    'Checking for extra sparkles…',
  ];

  // Check for active jobs on mount and show progress if reconnected
  useEffect(() => {
    if (currentJob && isQueueGenerating && !hasShownReconnectionRef.current) {
      hasShownReconnectionRef.current = true;
      console.log('🔄 Reconnected to active job, showing progress dialog');
      setGeneratingStatus(currentJob.status as any);
      setQueueProgress(currentJob.progress);
      setQueueMessage(currentJob.message);
      setIsGenerating(true);
      setProgressOpen(true);
      setShowReconnectionBanner(true);
    }
  }, [currentJob?.jobId]); // Only depend on jobId to avoid loops

  // Always show funny progress timer alongside real backend progress
  useEffect(() => {
    // Show timer whenever generating (both queue and non-queue operations)
    if (!isGenerating && !isQueueGenerating) return;
    
    setProgress(0);
    setProgressMsg(PROGRESS_WORDS[0]);
    const start = Date.now();
    const duration = 80_000; // 1 minute 20 seconds
    const handle = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const pct = Math.floor(eased * 100);
      setProgress(pct);
      const idx = Math.min(PROGRESS_WORDS.length - 1, Math.floor(elapsed / 8000)); // Change message every 8 seconds
      setProgressMsg(PROGRESS_WORDS[idx]);
      
      // Don't auto-complete timer - let WebSocket handle completion
      if (t >= 1) {
        setProgress(95); // Cap at 95% until WebSocket confirms completion
        setProgressMsg('Almost ready...');
      }
    }, 300);
    return () => clearInterval(handle);
  }, [isGenerating, isQueueGenerating, PROGRESS_WORDS]);
  // simplified: no extra placeholder editing here

  // Load saved state from URL parameters and session if returning from a previous step
  useEffect(() => {
    const heroNameParam = searchParams.get('heroName');
    const promptParam = searchParams.get('prompt');
    if (heroNameParam) setHeroName(heroNameParam);
    if (promptParam) setPrompt(promptParam);
    // Restore placeholders
    try {
      const rawPH = sessionStorage.getItem('placeholder_values');
      if (rawPH) setPlaceholderValues(JSON.parse(rawPH));
    } catch {}
    // Restore upload state (image + name)
    try {
      const raw = sessionStorage.getItem('upload_state');
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.originalImageBase64) {
          setOriginalImageBase64(s.originalImageBase64);
          setTitleImageUrl(s.originalImageBase64);
        }
        if (s?.heroName && !heroNameParam) setHeroName(s.heroName);
      }
    } catch {}
    // Load selected series key (from theme selection)
    try {
      const ss = sessionStorage.getItem('selected_series');
      if (ss) {
        const o = JSON.parse(ss);
        if (o?.series_key) setSeriesKey(String(o.series_key));
      }
    } catch {}
  }, [searchParams]);

  // Prefetch placeholder definitions for the selected story and seed defaults
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!storyId) return;
      try {
        // Fetch placeholder definitions (includes default_value per key)
        const resp = await fetch(`/api/templates/placeholders?storyId=${encodeURIComponent(storyId)}`, { cache: 'no-store' });
        const json = await resp.json();
        const defs: TemplatePlaceholder[] = Array.isArray(json?.placeholders) ? json.placeholders : [];
        if (!cancelled) setPlaceholderDefs(defs);
        // Build default map from defs
        const defaults: Record<string, string> = {};
        for (const d of defs as Array<{ key: string; default_value?: string | null }>) {
          defaults[d.key] = (d.default_value ?? '') as string;
        }
        // Merge with any existing values and current heroName
        const existingRaw = sessionStorage.getItem('placeholder_values');
        const existing = existingRaw ? JSON.parse(existingRaw) : {};
        const merged = { ...defaults, ...existing } as Record<string, string>;
        if (heroName) merged.heroName = heroName;
        if (!cancelled) {
          setPlaceholderValues(merged);
          // Persist to session so later steps reuse these
          try { sessionStorage.setItem('placeholder_values', JSON.stringify(merged)); } catch {}
        }
      } catch (e) {
        console.warn('Failed to prefetch placeholders for story', storyId, e);
      }
    })();
    return () => { cancelled = true; };
  }, [storyId, heroName]);

  // Ensure we have defs when dialog opens (in case initial prefetch raced)
  useEffect(() => {
    let cancelled = false;
    if (!moreOptionsOpen || !storyId || placeholderDefs.length > 0) return;
    (async () => {
      try {
        const resp = await fetch(`/api/templates/placeholders?storyId=${encodeURIComponent(storyId)}`, { cache: 'no-store' });
        const json = await resp.json();
        const defs: TemplatePlaceholder[] = Array.isArray(json?.placeholders) ? json.placeholders : [];
        if (!cancelled && defs.length) setPlaceholderDefs(defs);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [moreOptionsOpen, storyId, placeholderDefs.length]);

  // Pre-fill prompt based on theme selection for AI-assisted mode
  useEffect(() => {
    if (theme && mode === 'ai-assisted') {
      const selectedTheme = THEMES.find(t => t.slug === theme);
      if (selectedTheme && !prompt) {
        setPrompt(`Create a ${selectedTheme.name.toLowerCase()} story for children. ${selectedTheme.description}. Make it engaging and age-appropriate with the hero as the main character.`);
      }
    } else if (mode === 'custom' && !prompt) {
      setPrompt('');
    }
  }, [theme, mode, prompt]);

  // simplified: keep only local heroName; preview step handles placeholders
  const applyPlaceholders = (text: string) => {
    if (!text) return '';
    let out = text;
    const values: Record<string, string> = {
      ...(placeholderValues || {}),
      heroName: heroName || (placeholderValues?.heroName ?? 'Hero'),
    };
    for (const [k, v] of Object.entries(values)) {
      out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? '');
    }
    return out;
  };

  const handleImageUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setTitleImage(file);
      setTitleImageUrl(URL.createObjectURL(file));
      
      toast.info('Compressing image...');
      
      try {
        // Compress image to reduce size - 512x512 max, 80% quality, JPEG format
        let compressedBase64 = await compressImage(file, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.8,
          format: 'image/jpeg'
        });
        // Pad to square with whitespace so title gen has a square input
        try {
          compressedBase64 = await padBase64ToSquare(compressedBase64, 512, '#ffffff', 'image/jpeg', 0.9);
        } catch {}
        
        const size = getBase64Size(compressedBase64);
        console.log(`Compressed image: ${size.mb.toFixed(2)}MB`);
        
        setOriginalImageBase64(compressedBase64);
        
        // Reset generated cover when new image is uploaded
        setGeneratedCoverImage('');
        
        // Track image upload in history
        const uploadHistory = {
          id: `upload-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'image_uploaded',
          data: {
            fileName: file.name,
            originalSize: (file.size / 1024 / 1024).toFixed(2),
            compressedSize: size.mb.toFixed(2),
            mode: mode,
            theme: theme
          }
        };
        
        const existingHistory = JSON.parse(sessionStorage.getItem('user_history') || '[]');
        existingHistory.push(uploadHistory);
        
        if (existingHistory.length > 10) {
          existingHistory.shift();
        }
        
        sessionStorage.setItem('user_history', JSON.stringify(existingHistory));
        // Persist upload state
        try {
          const upRaw = sessionStorage.getItem('upload_state');
          const up = upRaw ? JSON.parse(upRaw) : {};
          sessionStorage.setItem('upload_state', JSON.stringify({
            ...up,
            theme,
            storyId,
            originalImageBase64: compressedBase64,
            heroName,
          }));
        } catch {}
        
        toast.success(`Image uploaded and compressed (${size.mb.toFixed(1)}MB)`);
      } catch (error) {
        console.error('Image compression failed:', error);
        toast.error('Failed to compress image');
      }
    }
  };

  // No analysis step needed for Qwen pipeline

  const removeImage = () => {
    setTitleImage(null);
    setTitleImageUrl('');
    setOriginalImageBase64('');
    setGeneratedCoverImage('');
    setHeroName('');
    toast.success('Image removed');
    try {
      const upRaw = sessionStorage.getItem('upload_state');
      const up = upRaw ? JSON.parse(upRaw) : {};
      sessionStorage.setItem('upload_state', JSON.stringify({ ...up, originalImageBase64: '' }));
    } catch {}
  };

  // Handle completed image from queue system
  const handleQueueImageCompleted = async (imageUrl: string) => {
    try {
      toast.info('Processing completed image...');
      
      // For now, we'll assume it's already a base64 data URL
      // In production, you might need to fetch and convert the image
      setGeneratedCoverImage(imageUrl);
      
      // Store in session storage for next step
      sessionStorage.setItem('preview_images', JSON.stringify({
        coverImage: imageUrl,
        originalImage: originalImageBase64
      }));
      
      // Store placeholder values
      sessionStorage.setItem('placeholder_values', JSON.stringify({
        heroName,
        ...placeholderValues
      }));
      
      toast.success('Preview generated successfully!');
      setGeneratingStatus('completed');
      setProgressOpen(false);
      
      // Navigate to preview page
      const searchParams = new URLSearchParams({
        mode: mode,
        heroName: heroName,
        age: ageGroup,
        length: String(bookLength),
        style: styleKey,
      });
      
      if (theme) searchParams.set('theme', theme);
      if (storyId) searchParams.set('storyId', storyId);
      
      router.push(`/create/preview?${searchParams.toString()}`);
      
    } catch (error) {
      console.error('Error processing completed image:', error);
      toast.error('Failed to process completed image');
      setGeneratingStatus('failed');
    }
  };

  const generateSample = async () => {
    if (!titleImage && !titleImageUrl) {
      toast.error('Please upload an image first');
      return;
    }

    if (mode === 'ai-assisted' && !heroName.trim()) {
      toast.error('Please provide a hero name');
      return;
    }

    if (mode === 'custom' && !prompt.trim()) {
      toast.error('Please provide a story description');
      return;
    }

    if (mode === 'custom' && prompt.length < LIMITS.PROMPT_MIN_LENGTH) {
      toast.error(`Description must be at least ${LIMITS.PROMPT_MIN_LENGTH} characters`);
      return;
    }

    setIsGenerating(true);
    try {
      toast.info('Generating your book cover...');

      // Persist selected style and enhanced prompt for audit/debug
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
      const normalizedStyleKey = (styleMap[styleKey] ? styleKey : 'bright-cartoon') as keyof typeof styleMap;
      const styleLine = `Please stylise the image in the style of ${styleMap[normalizedStyleKey]}.`;
      const finalPrompt = `${prompt || ''} ${styleLine}`.trim();
      try {
        sessionStorage.setItem('customer_prompt', finalPrompt);
        const upRaw = sessionStorage.getItem('upload_state');
        const up = upRaw ? JSON.parse(upRaw) : {};
        sessionStorage.setItem('upload_state', JSON.stringify({ ...up, styleKey, customerPrompt: finalPrompt }));
      } catch {}

      // Use the queue system for image generation
      console.log('🚀 Starting queue-based image generation');
      setGeneratingStatus('queued');
      
      // Fetch cover page spec from template (pageNumber 0 / title page)
      let coverSpec: any | null = null;
      let coverImagePrompt = '';
      let overlayTitleText: string | null = null;
      try {
        if (storyId) {
          const ageNum = parseInt((ageGroup.split('-')[0] || '5'), 10);
          const { data, error } = await supabase.rpc('get_story_pages_full_for_age', { p_story_id: storyId, p_age: ageNum });
          if (!error && Array.isArray(data)) {
            const cover = (data as any[]).find((r: any) => Number(r.page_number) === 0 || r.is_title);
            if (cover) {
              coverImagePrompt = applyPlaceholders(String(cover.image_description || ''));
              const rawOverlay = cover?.raw?.titleOverlay?.text ?? cover?.text ?? '';
              overlayTitleText = applyPlaceholders(String(rawOverlay));
              coverSpec = {
                pageNumber: 0,
                kind: 'title',
                isTitle: true,
                text: String(cover.text || ''),
                imageDescription: coverImagePrompt,
                artStyleNotes: String(cover.art_style_notes || ''),
                titleOverlay: {
                  text: overlayTitleText || '',
                  placement: cover?.raw?.titleOverlay?.placement ?? null,
                  fontGuidance: cover?.raw?.titleOverlay?.fontGuidance ?? null,
                  safeMarginsInches: cover?.raw?.titleOverlay?.safeMarginsInches ?? null,
                },
              };
            }
          }
        }
      } catch (e) {
        console.warn('Failed to fetch cover spec for story', storyId, e);
      }

      // Derive a title/overlay for the front cover
      const fallbackTitle = (() => {
        const t = selectedTheme?.name || (theme ? theme : 'Adventure');
        return heroName ? `${heroName}'s ${t} Story` : `${t} Story`;
      })();
      const derivedTitle = overlayTitleText || fallbackTitle;
      const coverText = derivedTitle;

      // Compose a prompt override combining cover scene, overlay instruction, and style guidance
      const overlayInstruction = (() => {
        const placement = coverSpec?.titleOverlay?.placement || 'top-center';
        const margin = coverSpec?.titleOverlay?.safeMarginsInches || 1.25;
        const text = (overlayTitleText || fallbackTitle).replace(/\"/g, '"');
        return `Include a clear title overlay: "${text}" placed ${placement}. Reserve a clean ${margin}in band for the title (high-contrast), and do not obstruct faces, hands, or key scene elements.`;
      })();
      const composedCoverPrompt = (
        mode === 'custom'
          ? `${finalPrompt} ${coverImagePrompt} ${overlayInstruction}`.trim()
          : `${coverImagePrompt} ${overlayInstruction} ${styleLine}`.trim()
      );

      const request = {
        heroName: mode === 'ai-assisted' ? heroName : 'Hero',
        themeId: theme || undefined,
        storyId: storyId,
        seriesKey: seriesKey || undefined,
        originalImageBase64,
        ageGroup: ageGroup,
        length: bookLength,
        styleKey,
        kind: 'cover' as const,
        coverPromptOverride: composedCoverPrompt || undefined,
        placeholders: { ...placeholderValues, heroName },
        title: derivedTitle,
        coverText,
        coverSpec,
      };

      toast.info('Starting image generation...');
      await generateImage(request);
      
      // The rest of the logic will be handled by the onCompleted callback
    } catch (error) {
      console.error('Preview generation error:', error);
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
      setProgressOpen(false);
    }
  };

  const selectedTheme = theme ? THEMES.find(t => t.slug === theme) : null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Reconnection Banner */}
      {showReconnectionBanner && (
        <ReconnectionBanner 
          jobId={currentJob?.jobId || null}
          onDismiss={() => setShowReconnectionBanner(false)}
          autoHide={true}
          autoHideDelay={8000}
        />
      )}
      
      {/* Progress Steps at Top */}
      <ProgressSteps 
        mode={mode} 
        currentStep={2} 
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
          {mode === 'ai-assisted' ? 'Upload Hero Photo' : 'Upload Your Image'}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {mode === 'ai-assisted' 
            ? 'Add a photo and name to create your personalized story'
            : 'Upload an image and describe your story idea'
          }
        </p>
      </div>

      {/* Theme panel (noticeable, colored, no image) */}
      {selectedTheme && (
        <div className="max-w-xl mx-auto">
          <div className="rounded-md bg-primary/10 border border-primary/30 px-4 py-3 text-center">
            <div className="text-base sm:text-lg font-semibold text-primary">Theme: {selectedTheme.name}</div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-6">
        {/* Image Upload + Name + More options */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 max-w-2xl mx-auto">
              <div className="text-sm text-muted-foreground text-center">Add a photo and name to create your personalized story</div>
              <div>
                <Label htmlFor="hero-name" className="text-base font-medium">Child’s name *</Label>
                <div className="mt-2 flex items-center gap-2">
                  <Input
                    id="hero-name"
                    value={heroName}
                    onChange={(e) => {
                      setHeroName(e.target.value);
                      try {
                        const raw = sessionStorage.getItem('placeholder_values');
                        const prev = raw ? JSON.parse(raw) : {};
                        sessionStorage.setItem('placeholder_values', JSON.stringify({ ...prev, heroName: e.target.value }));
                        const upRaw = sessionStorage.getItem('upload_state');
                        const up = upRaw ? JSON.parse(upRaw) : {};
                        sessionStorage.setItem('upload_state', JSON.stringify({ ...up, heroName: e.target.value }));
                      } catch {}
                    }}
                    placeholder="e.g., Daniyal"
                    className="w-full"
                  />
                  {storyId && (
                    <Dialog open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="whitespace-nowrap">More options</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Customize details</DialogTitle>
                        </DialogHeader>
                        <div className="text-xs text-muted-foreground mb-2">Updates preview and final book</div>
                        <PlaceholdersForm
                         storyId={storyId}
                          excludeKeys={["heroName"]}
                          initialValues={placeholderValues}
                          preloadedPlaceholders={placeholderDefs}
                          onChange={(vals) => setPlaceholderValues(vals)}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              {/* Illustration style selection */}
              <div className="mb-4">
                <Label className="text-base font-medium">Illustration style</Label>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'watercolor', title: 'Soft Watercolor Storybook', sub: 'Pastels, gentle gradients, textured paper' },
                    { key: 'bright-cartoon', title: 'Bright Cartoon (Bluey-Inspired)', sub: 'Bold colors, rounded shapes, clean outlines' },
                    { key: 'paper-collage', title: 'Paper-Cut Collage Style', sub: 'Layered textured paper, soft shadows' },
                    { key: 'fairytale', title: 'Fantasy Fairytale Style', sub: 'Whimsical scenes with magical highlights' },
                    { key: 'crayon-marker', title: 'Crayon & Marker Sketch', sub: 'Childlike lines, playful textures, bright colors' },
                    { key: 'anime-chibi', title: 'Anime Chibi / Ghibli-Inspired', sub: 'Cute proportions, big eyes, soft palettes' },
                  ].map((opt) => {
                    const active = styleKey === (opt.key as typeof styleKey);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setStyleKey(opt.key as any)}
                        className={[
                          'relative w-full text-left rounded-lg border p-3 transition-colors',
                          active ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'hover:bg-muted',
                        ].join(' ')}
                        aria-pressed={active}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold leading-snug">{opt.title}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{opt.sub}</div>
                          </div>
                          <div className={['h-5 w-5 rounded-full border flex items-center justify-center mt-0.5', active ? 'bg-primary text-primary-foreground border-primary' : 'border-muted-foreground/30'].join(' ')}>
                            {active ? '✓' : ''}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {titleImageUrl ? (
              <div className="space-y-4 p-4">
                <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden max-w-sm mx-auto">
                  <Image 
                    src={titleImageUrl} 
                    alt={mode === 'ai-assisted' ? 'Hero photo' : 'Title image'}
                    width={300}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (files) handleImageUpload(Array.from(files));
                        };
                        input.click();
                      }}
                    >
                      Replace
                    </Button>
                    <Button variant="outline" size="sm" onClick={removeImage}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <FileUpload
                onFileSelect={handleImageUpload}
                maxFiles={1}
                maxSize={LIMITS.MAX_IMAGE_SIZE}
                accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
              />
            )}
          </CardContent>
        </Card>

        {/* Actions below the image upload */}
        <div className="max-w-2xl mx-auto px-2 sm:px-0 flex items-center justify-between gap-3">
          <Button variant="ghost" asChild>
            <Link href={mode === 'ai-assisted' && theme ? `/create/theme?mode=${mode}` : '/create'}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Link>
          </Button>
          <Button
            onClick={() => setConfirmOpen(true)}
            disabled={
              (!titleImage && !titleImageUrl) || 
              (mode === 'ai-assisted' && !heroName.trim()) ||
              (mode === 'custom' && !prompt.trim()) ||
              isGenerating || isQueueGenerating
            }
            size="lg"
          >
            {(isGenerating || isQueueGenerating) ? (
              <>
                <LoadingSpinner className="h-4 w-4 mr-2" />
                {queueMessage || 'Creating preview...'}
              </>
            ) : (
              <>Create Free Preview</>
            )}
          </Button>
        </div>

        {/* Confirm modal before generating preview */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Build your preview</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground">We’ll generate a quick preview cover (and sample) next. This usually takes about 1–2 minutes depending on load.</div>
            <div className="mt-3 text-sm">
              <div><span className="font-medium">Child’s name:</span> {heroName || '(not set)'}</div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  setConfirmOpen(false);
                  setProgressOpen(true);
                  setIsGenerating(true);
                  generateSample();
                }}
              >
                Start
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Progress dialog during preview generation */}
        <Dialog open={progressOpen || (isQueueGenerating && generatingStatus !== 'idle')} onOpenChange={setProgressOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Creating your preview…</DialogTitle>
            </DialogHeader>
            <div className="text-sm text-muted-foreground mb-4">This usually takes about 1–2 minutes.</div>
            {/* Backend status indicator */}
            {isQueueGenerating && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Backend Status:</span>
                  <div className="flex items-center gap-2">
                    {generatingStatus === 'queued' && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        <span className="text-yellow-600">Queued</span>
                      </>
                    )}
                    {generatingStatus === 'processing' && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                        <span className="text-blue-600">Processing</span>
                      </>
                    )}
                    {generatingStatus === 'completed' && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <span className="text-green-600">Completed</span>
                      </>
                    )}
                    {generatingStatus === 'failed' && (
                      <>
                        <div className="h-2 w-2 rounded-full bg-red-500"></div>
                        <span className="text-red-600">Failed</span>
                      </>
                    )}
                  </div>
                </div>
                {queueMessage && (
                  <div className="text-xs text-muted-foreground mt-1 text-center">
                    {queueMessage}
                  </div>
                )}
                {queueProgress > 0 && (
                  <div className="w-full h-1 rounded bg-muted overflow-hidden mt-2">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${queueProgress}%` }} />
                  </div>
                )}
              </div>
            )}
            
            {generatingStatus === 'failed' && (
              <div className="text-xs text-red-500 mt-3 text-center border-t pt-3">
                Generation failed. Please try again.
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Custom mode story description */}
        {mode !== 'ai-assisted' && (
          <Card>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div>
                <Label htmlFor="prompt" className="text-base font-medium">Describe your story *</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="What kind of story do you want to create?"
                  className="min-h-[100px] mt-2"
                  maxLength={LIMITS.PROMPT_MAX_LENGTH}
                />
                <div className="text-xs text-muted-foreground mt-1">
                  {prompt.length}/{LIMITS.PROMPT_MAX_LENGTH} characters
                </div>
              </div>
            </CardContent>
          </Card>
        )}


        
      </div>
      
    </div>
  );
}
