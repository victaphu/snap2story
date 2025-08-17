'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Upload, Sparkles, Image as ImageIcon, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { LIMITS, THEMES, AGE_GROUPS, LENGTHS } from '@/lib/constants';
import { ProgressSteps } from './progress-steps';
import { usePreview } from '@/contexts/preview-context';
import { compressImage, compressBase64Image, getBase64Size } from '@/lib/image-utils';

export function UploadPhotoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setPreviewData } = usePreview();
  const mode = searchParams.get('mode') || 'ai-assisted';
  const theme = searchParams.get('theme');
  const ageParam = searchParams.get('age') || undefined;
  const lengthParam = searchParams.get('length') || undefined;
  const [ageGroup, setAgeGroup] = useState<string>(ageParam || (AGE_GROUPS[3]?.id || '5-6'));
  const [bookLength, setBookLength] = useState<number>(lengthParam ? Number(lengthParam) : 20);
  
  const [titleImage, setTitleImage] = useState<File | null>(null);
  const [titleImageUrl, setTitleImageUrl] = useState<string>('');
  const [heroName, setHeroName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [heroAnalysis, setHeroAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [generatedCoverImage, setGeneratedCoverImage] = useState<string>('');
  const [originalImageBase64, setOriginalImageBase64] = useState<string>('');

  // Load saved state from URL parameters if returning from a previous step
  useEffect(() => {
    const heroNameParam = searchParams.get('heroName');
    const promptParam = searchParams.get('prompt');
    if (heroNameParam) setHeroName(heroNameParam);
    if (promptParam) setPrompt(promptParam);
  }, [searchParams]);

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

  const handleImageUpload = async (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setTitleImage(file);
      setTitleImageUrl(URL.createObjectURL(file));
      
      toast.info('Compressing image...');
      
      try {
        // Compress image to reduce size - 512x512 max, 80% quality, JPEG format
        const compressedBase64 = await compressImage(file, {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.8,
          format: 'image/jpeg'
        });
        
        const size = getBase64Size(compressedBase64);
        console.log(`Compressed image: ${size.mb.toFixed(2)}MB`);
        
        setOriginalImageBase64(compressedBase64);
        
        // Reset analysis and generated states when new image is uploaded
        setHeroAnalysis(null);
        setShowAnalysis(false);
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
        
        toast.success(`Image uploaded and compressed (${size.mb.toFixed(1)}MB)`);
      } catch (error) {
        console.error('Image compression failed:', error);
        toast.error('Failed to compress image');
      }
    }
  };

  const analyzeHeroImage = async (imageFile: File, compressedBase64?: string) => {
    const formData = new FormData();
    if (compressedBase64) {
      formData.append('compressedBase64', compressedBase64);
    } else {
      formData.append('image', imageFile);
    }

    const response = await fetch('/api/analyze-hero', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to analyze image');
    }

    const result = await response.json();
    
    if (result.success) {
      return result.analysis;
    } else {
      throw new Error(result.error || 'Analysis failed');
    }
  };

  const removeImage = () => {
    setTitleImage(null);
    setTitleImageUrl('');
    setOriginalImageBase64('');
    setHeroAnalysis(null);
    setShowAnalysis(false);
    setGeneratedCoverImage('');
    setHeroName('');
    toast.success('Image removed');
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
      let currentHeroAnalysis = heroAnalysis;

      // For AI-assisted mode, analyze the image first if not already done
      if (mode === 'ai-assisted' && !heroAnalysis && titleImage) {
        setIsAnalyzing(true);
        toast.info('Analyzing your photo...');
        
        try {
          // Use compressed image for analysis to reduce payload
          currentHeroAnalysis = await analyzeHeroImage(titleImage, originalImageBase64);
          setHeroAnalysis(currentHeroAnalysis);
          setShowAnalysis(true);
          toast.success(`Analysis complete: ${currentHeroAnalysis.description}`);
        } catch (error) {
          console.error('Image analysis failed:', error);
          toast.error('Image analysis failed, but continuing with generation...');
          // Continue without analysis for fallback
        } finally {
          setIsAnalyzing(false);
        }
      }

      toast.info('Generating your book cover...');

      // Call the OpenAI API to generate preview
      const response = await fetch('/api/generate-preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroName: mode === 'ai-assisted' ? heroName : 'Hero',
          themeId: theme,
          heroAnalysis: mode === 'ai-assisted' ? currentHeroAnalysis : null,
          originalImageBase64,
          ageGroup: ageGroup,
          length: bookLength,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }

      const previewData = await response.json();
      
      // Log and compress the generated cover image
      const originalSize = getBase64Size(previewData.coverImage);
      console.log(`Original generated image: ${originalSize.mb.toFixed(2)}MB`);
      
      toast.info('Compressing generated image...');
      
      try {
        // Compress the generated image to reduce size further
        const compressedCoverImage = await compressBase64Image(previewData.coverImage, {
          // Further reduce preview size and quality for faster loads
          maxWidth: 384,
          maxHeight: 384,
          quality: 0.6,
          format: 'image/jpeg'
        });
        
        const compressedSize = getBase64Size(compressedCoverImage);
        console.log(`Compressed generated image: ${compressedSize.mb.toFixed(2)}MB`);
        
        // Store the compressed generated cover image in memory
        setGeneratedCoverImage(compressedCoverImage);
        
        // Store complete preview data in context with compressed images
        const contextPreviewData = {
          id: previewData.id,
          title: previewData.title,
          themeId: previewData.themeId,
          coverImage: compressedCoverImage,
          originalImage: originalImageBase64,
          storyTemplate: previewData.storyTemplate,
          heroAnalysis: previewData.heroAnalysis || currentHeroAnalysis,
          heroName: previewData.heroName,
          theme: previewData.theme,
          createdAt: previewData.createdAt
        };
        setPreviewData(contextPreviewData);
        
        // Save to session storage for history
        const historyEntry = {
          id: previewData.id,
          timestamp: new Date().toISOString(),
          action: 'preview_generated',
          data: {
            heroName: previewData.heroName,
            themeId: previewData.themeId,
            title: previewData.title,
            mode: mode,
            originalImageSize: originalSize.mb,
            compressedImageSize: compressedSize.mb,
            heroAnalysis: currentHeroAnalysis
          }
        };
        
        // Get existing history
        const existingHistory = JSON.parse(sessionStorage.getItem('user_history') || '[]');
        existingHistory.push(historyEntry);
        
        // Keep only last 10 entries to avoid storage issues
        if (existingHistory.length > 10) {
          existingHistory.shift();
        }
        
        sessionStorage.setItem('user_history', JSON.stringify(existingHistory));
        
        toast.success(`Preview generated! Images compressed: ${(originalSize.mb + getBase64Size(originalImageBase64).mb).toFixed(1)}MB → ${(compressedSize.mb + getBase64Size(originalImageBase64).mb).toFixed(1)}MB`);
        
        // Navigate to preview page immediately after generation
        const searchParams = new URLSearchParams({
          mode: mode,
          heroName: previewData.heroName,
          themeId: previewData.themeId,
          title: previewData.title,
          age: ageGroup,
          length: String(bookLength)
        });
        
        if (theme) searchParams.set('theme', theme);
        
        router.push(`/create/preview?${searchParams.toString()}`);
      } catch (error) {
        console.error('Failed to compress generated image:', error);
        // Fallback to uncompressed
        setGeneratedCoverImage(previewData.coverImage);
        const contextPreviewData = {
          id: previewData.id,
          title: previewData.title,
          themeId: previewData.themeId,
          coverImage: previewData.coverImage,
          originalImage: originalImageBase64,
          storyTemplate: previewData.storyTemplate,
          heroAnalysis: previewData.heroAnalysis || currentHeroAnalysis,
          heroName: previewData.heroName,
          theme: previewData.theme,
          createdAt: previewData.createdAt
        };
        setPreviewData(contextPreviewData);
        
        // Save to session storage for history (even on compression failure)
        const historyEntry = {
          id: previewData.id,
          timestamp: new Date().toISOString(),
          action: 'preview_generated',
          data: {
            heroName: previewData.heroName,
            themeId: previewData.themeId,
            title: previewData.title,
            mode: mode,
            originalImageSize: originalSize.mb,
            compressedImageSize: originalSize.mb, // Same as original since compression failed
            heroAnalysis: currentHeroAnalysis,
            compressionFailed: true
          }
        };
        
        // Get existing history
        const existingHistory = JSON.parse(sessionStorage.getItem('user_history') || '[]');
        existingHistory.push(historyEntry);
        
        // Keep only last 10 entries to avoid storage issues
        if (existingHistory.length > 10) {
          existingHistory.shift();
        }
        
        sessionStorage.setItem('user_history', JSON.stringify(existingHistory));
        
        toast.success('Preview generated! (compression failed, using original size)');
        
        // Navigate to preview page immediately after generation (fallback case)
        const searchParams = new URLSearchParams({
          mode: mode,
          heroName: previewData.heroName,
          themeId: previewData.themeId,
          title: previewData.title,
          age: ageGroup,
          length: String(bookLength)
        });
        
        if (theme) searchParams.set('theme', theme);
        
        router.push(`/create/preview?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setIsGenerating(false);
      setIsAnalyzing(false);
    }
  };

  const selectedTheme = theme ? THEMES.find(t => t.slug === theme) : null;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto px-4">
      {/* Progress Steps at Top */}
      <ProgressSteps 
        mode={mode} 
        currentStep={2} 
      />

      {/* Header */}
      <div className="text-center space-y-2">
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={mode === 'ai-assisted' && theme ? `/create/theme?mode=${mode}` : '/create'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
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

      {/* Theme Info - Mobile and Desktop */}
      {selectedTheme && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 text-center">
            <h3 className="font-semibold text-primary">
              {selectedTheme.name} Selected
            </h3>
            <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
              AI will create a story tailored to this theme with your characters as the main heroes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className="space-y-4 sm:space-y-6">
        {/* Image Upload */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            {titleImageUrl ? (
              <div className="space-y-4">
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

        {/* Input Fields */}
        <Card>
          <CardContent className="p-4 sm:p-6 space-y-4">
            {mode === 'ai-assisted' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                <div>
                  <Label className="text-base font-medium">Age Group</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AGE_GROUPS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAgeGroup(a.id)}
                        className={`px-3 py-2 border rounded-full text-sm ${ageGroup===a.id?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted'}`}
                        type="button"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-base font-medium">Length</Label>
                  <div className="flex gap-2 mt-2">
                    {LENGTHS.map((len) => (
                      <button
                        key={String(len)}
                        onClick={() => setBookLength(len)}
                        className={`px-4 py-2 border rounded-md text-sm ${bookLength===len?'bg-primary text-primary-foreground border-primary':'bg-background hover:bg-muted'}`}
                        type="button"
                      >
                        {len} pages
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {mode === 'ai-assisted' ? (
              <div>
                <Label htmlFor="hero-name" className="text-base font-medium">Hero Name *</Label>
                <Input
                  id="hero-name"
                  value={heroName}
                  onChange={(e) => setHeroName(e.target.value)}
                  placeholder="Enter the hero's name..."
                  className="mt-2"
                />
              </div>
            ) : (
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
            )}

            <Button 
              onClick={generateSample}
              disabled={
                (!titleImage && !titleImageUrl) || 
                (mode === 'ai-assisted' && !heroName.trim()) ||
                (mode === 'custom' && !prompt.trim()) ||
                isGenerating
              }
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <LoadingSpinner className="h-4 w-4 mr-2" />
                  {isAnalyzing ? 'Analyzing photo...' : 'Creating preview...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Free Preview
                </>
              )}
            </Button>
          </CardContent>
        </Card>


        {/* Simple info */}
        <div className="text-center text-sm text-muted-foreground space-y-1">
          <p>💡 We&apos;ll analyze your photo and create a free preview</p>
          <p>✨ Then generate your full 20-page story for $5</p>
        </div>
      </div>
    </div>
  );
}
