'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Plus, X, Upload, Edit, Eye, Save, Image as ImageIcon, Type, Trash2, Move, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { LIMITS } from '@/lib/constants';

interface CustomPage {
  id: string;
  pageNumber: number;
  type: 'cover' | 'content';
  title?: string;
  text: string;
  image?: File | string;
  imageUrl?: string;
}

export function CustomStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paid = searchParams.get('paid') === 'true';
  
  const [storyTitle, setStoryTitle] = useState('');
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);

  // Check paid access
  useEffect(() => {
    const checkPaidAccess = () => {
      if (paid) {
        setHasPaidAccess(true);
        return;
      }
      
      const currentDraft = sessionStorage.getItem('current_story_draft');
      if (currentDraft) {
        const draft = JSON.parse(currentDraft);
        if (draft.status === 'paid') {
          setHasPaidAccess(true);
          return;
        }
      }
      
      // Redirect to title page if no paid access
      toast.error('Please complete the payment process first');
      router.push('/create/title-page?mode=custom');
    };

    checkPaidAccess();
  }, [paid, router]);

  // Initialize with front cover
  useEffect(() => {
    if (hasPaidAccess) {
      setPages([
        {
          id: 'front-cover',
          pageNumber: 0,
          type: 'cover',
          title: 'Front Cover',
          text: 'Your Amazing Story Title',
          imageUrl: undefined,
        }
      ]);
    }
  }, [hasPaidAccess]);

  const addPage = () => {
    if (pages.length >= LIMITS.MAX_CUSTOM_PAGES + 1) { // +1 for cover
      toast.error(`Maximum of ${LIMITS.MAX_CUSTOM_PAGES} content pages allowed`);
      return;
    }

    const newPage: CustomPage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length,
      type: 'content',
      text: '',
    };

    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
    toast.success('New page added');
  };

  const deletePage = (pageId: string) => {
    if (pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }

    setPages(prev => {
      const filtered = prev.filter(p => p.id !== pageId);
      // Renumber pages
      return filtered.map((page, index) => ({
        ...page,
        pageNumber: index,
      }));
    });

    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(Math.max(0, pages.length - 2));
    }
    toast.success('Page deleted');
  };

  const updatePage = (pageId: string, updates: Partial<CustomPage>) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, ...updates } : page
    ));
  };

  const movePageUp = (pageIndex: number) => {
    if (pageIndex <= 1) return; // Can't move cover or first content page up
    
    setPages(prev => {
      const newPages = [...prev];
      [newPages[pageIndex], newPages[pageIndex - 1]] = [newPages[pageIndex - 1], newPages[pageIndex]];
      // Update page numbers
      return newPages.map((page, index) => ({
        ...page,
        pageNumber: index,
      }));
    });

    setCurrentPageIndex(pageIndex - 1);
  };

  const movePageDown = (pageIndex: number) => {
    if (pageIndex >= pages.length - 1) return;
    
    setPages(prev => {
      const newPages = [...prev];
      [newPages[pageIndex], newPages[pageIndex + 1]] = [newPages[pageIndex + 1], newPages[pageIndex]];
      // Update page numbers
      return newPages.map((page, index) => ({
        ...page,
        pageNumber: index,
      }));
    });

    setCurrentPageIndex(pageIndex + 1);
  };

  const handleImageUpload = (pageId: string, files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      const imageUrl = URL.createObjectURL(file);
      updatePage(pageId, { image: file, imageUrl });
      toast.success('Image uploaded');
    }
  };

  const removeImage = (pageId: string) => {
    updatePage(pageId, { image: undefined, imageUrl: undefined });
    toast.success('Image removed');
  };

  const saveStory = async () => {
    if (!storyTitle.trim()) {
      toast.error('Please enter a story title');
      return;
    }

    if (pages.length < 2) {
      toast.error('Please add at least one content page');
      return;
    }

    setIsSaving(true);
    try {
      // TODO: Save to Supabase
      const storyData = {
        title: storyTitle,
        pages: pages.map(page => ({
          ...page,
          // Convert File objects to base64 or upload to storage
          image: page.image instanceof File ? null : page.image,
        })),
        type: 'custom',
        status: 'draft',
        created_at: new Date().toISOString(),
      };

      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      sessionStorage.setItem('custom_story', JSON.stringify(storyData));
      toast.success('Story saved successfully!');
      router.push('/library');
    } catch (error) {
      toast.error('Failed to save story');
    } finally {
      setIsSaving(false);
    }
  };

  const currentPage = pages[currentPageIndex];

  // Show loading or redirect if no paid access
  if (!hasPaidAccess) {
    return (
      <div className="space-y-8 max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Payment Required</h1>
            <p className="text-muted-foreground">Please complete the payment process to continue</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/create/title-page?mode=custom">Start Story Creation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/create/title-page">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Title Page
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Custom Adventure Editor</h1>
          <p className="text-muted-foreground">
            Create your own story with complete control over content and images
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={saveStory} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Story'}
          </Button>
        </div>
      </div>

      {/* Story Title */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="story-title" className="whitespace-nowrap">Story Title:</Label>
            <Input
              id="story-title"
              value={storyTitle}
              onChange={(e) => setStoryTitle(e.target.value)}
              placeholder="Enter your story title..."
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pages ({pages.length})</CardTitle>
                <Button
                  size="sm"
                  onClick={addPage}
                  disabled={pages.length >= LIMITS.MAX_CUSTOM_PAGES + 1}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pages.map((page, index) => (
                <div
                  key={page.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentPageIndex === index 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setCurrentPageIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {page.type === 'cover' ? (
                        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-bold">C</span>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center">
                          <span className="text-xs">{index}</span>
                        </div>
                      )}
                      <span className="text-sm font-medium truncate">
                        {page.title || page.text.slice(0, 20) || 'Untitled'}
                      </span>
                    </div>
                    
                    {page.type !== 'cover' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            movePageUp(index);
                          }}
                          disabled={index <= 1}
                          className="h-6 w-6 p-0"
                        >
                          <Move className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(page.id);
                          }}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {pages.length < LIMITS.MAX_CUSTOM_PAGES + 1 && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {LIMITS.MAX_CUSTOM_PAGES + 1 - pages.length} more pages allowed
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Page Editor */}
        <div className="lg:col-span-3">
          {currentPage && (
            <div className="space-y-6">
              {isPreviewMode ? (
                <PreviewMode page={currentPage} />
              ) : (
                <EditMode 
                  page={currentPage} 
                  onUpdate={(updates) => updatePage(currentPage.id, updates)}
                  onImageUpload={(files) => handleImageUpload(currentPage.id, files)}
                  onRemoveImage={() => removeImage(currentPage.id)}
                />
              )}
              
              {/* Navigation */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPageIndex(Math.max(0, currentPageIndex - 1))}
                  disabled={currentPageIndex === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous Page
                </Button>
                
                <span className="flex items-center text-sm text-muted-foreground">
                  Page {currentPageIndex + 1} of {pages.length}
                </span>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPageIndex(Math.min(pages.length - 1, currentPageIndex + 1))}
                  disabled={currentPageIndex === pages.length - 1}
                >
                  Next Page
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditMode({ 
  page, 
  onUpdate, 
  onImageUpload, 
  onRemoveImage 
}: { 
  page: CustomPage;
  onUpdate: (updates: Partial<CustomPage>) => void;
  onImageUpload: (files: File[]) => void;
  onRemoveImage: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Text Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            {page.type === 'cover' ? 'Cover Text' : 'Page Content'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {page.type === 'cover' && (
            <div>
              <Label htmlFor="page-title">Cover Title</Label>
              <Input
                id="page-title"
                value={page.title || ''}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Story title for the cover"
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="page-text">
              {page.type === 'cover' ? 'Subtitle or Author' : 'Page Text'}
            </Label>
            <Textarea
              id="page-text"
              value={page.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder={
                page.type === 'cover' 
                  ? 'Add a subtitle or author name...' 
                  : 'Write your story content for this page...'
              }
              className="min-h-[120px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Image Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Page Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          {page.imageUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
                <Image 
                  src={page.imageUrl} 
                  alt="Page content"
                  width={300}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files) onImageUpload(Array.from(files));
                    };
                    input.click();
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Replace Image
                </Button>
                <Button variant="outline" onClick={onRemoveImage}>
                  <X className="h-4 w-4 mr-2" />
                  Remove Image
                </Button>
              </div>
            </div>
          ) : (
            <FileUpload
              onFileSelect={onImageUpload}
              maxFiles={1}
              maxSize={LIMITS.MAX_IMAGE_SIZE}
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PreviewMode({ page }: { page: CustomPage }) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="aspect-[4/3] bg-gradient-to-br from-cream to-white rounded-lg border-2 border-muted p-8 flex flex-col">
          {page.imageUrl && (
            <div className="flex-1 mb-6">
              <Image 
                src={page.imageUrl} 
                alt="Page content"
                width={400}
                height={300}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
          )}
          
          <div className={`text-center space-y-2 ${!page.imageUrl ? 'flex-1 flex flex-col justify-center' : ''}`}>
            {page.title && (
              <h2 className="text-2xl font-bold text-foreground">{page.title}</h2>
            )}
            {page.text && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {page.text}
              </p>
            )}
            {!page.title && !page.text && (
              <p className="text-muted-foreground italic">Empty page</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}