'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Camera, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileUpload } from '@/components/ui/file-upload';
import { toast } from 'sonner';
import { LIMITS } from '@/lib/constants';

export function UploadHeroesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paid = searchParams.get('paid') === 'true';
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [hasPaidAccess, setHasPaidAccess] = useState(false);

  useEffect(() => {
    // Check if user has paid for story creation
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
      router.push('/create/title-page?mode=ai-assisted');
    };

    checkPaidAccess();
  }, [paid, router]);

  const handleFileSelect = (files: File[]) => {
    const remainingSlots = LIMITS.MAX_HERO_IMAGES - selectedFiles.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    setSelectedFiles(prev => [...prev, ...filesToAdd]);
    
    if (files.length > remainingSlots) {
      toast.info(`Only ${remainingSlots} more images can be added`);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (selectedFiles.length === 0) {
      router.push('/create/theme?skip_upload=true');
      return;
    }

    setIsUploading(true);
    try {
      // TODO: Upload files to Supabase storage
      // For now, we'll just simulate upload and store file data
      const fileData = selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        // In real implementation, this would be the uploaded URL
        url: URL.createObjectURL(file)
      }));
      
      // Store in sessionStorage for now (in real app, save to database)
      sessionStorage.setItem('hero_images', JSON.stringify(fileData));
      
      toast.success(`Uploaded ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''} successfully!`);
      router.push('/create/theme');
    } catch (error) {
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSkip = () => {
    router.push('/create/theme?skip_upload=true');
  };

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
          <Link href="/create/title-page?mode=ai-assisted">Start Story Creation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/create/title-page">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Upload Hero Photos</h1>
          <p className="text-muted-foreground">
            Upload 1-3 photos of the heroes of your story
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            1
          </div>
          <span className="ml-2 text-sm font-medium text-primary">Upload Photos</span>
        </div>
        <div className="w-16 h-px bg-border"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
            2
          </div>
          <span className="ml-2 text-sm text-muted-foreground">Choose Theme</span>
        </div>
        <div className="w-16 h-px bg-border"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">
            3
          </div>
          <span className="ml-2 text-sm text-muted-foreground">Describe Story</span>
        </div>
      </div>

      {/* Upload section */}
      <Card>
        <CardContent className="p-8">
          <div className="text-center space-y-4 mb-8">
            <Camera className="h-16 w-16 text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-xl font-semibold mb-2">Upload the Heroes of Your Story</h2>
              <p className="text-muted-foreground">
                These photos will be used by AI to create your personalized characters. 
                You can upload up to {LIMITS.MAX_HERO_IMAGES} images.
              </p>
            </div>
          </div>

          <FileUpload
            onFileSelect={handleFileSelect}
            maxFiles={LIMITS.MAX_HERO_IMAGES}
            maxSize={LIMITS.MAX_IMAGE_SIZE}
            selectedFiles={selectedFiles}
            onRemoveFile={handleRemoveFile}
            accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
          />

          {/* Tips */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900">Tips for best results:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use clear, well-lit photos where faces are clearly visible</li>
                  <li>• Include different people/pets you want in your story</li>
                  <li>• Photos from the chest up work best for character creation</li>
                  <li>• Avoid group photos with too many people</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          disabled={isUploading}
        >
          Skip for now
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={isUploading}
          className="min-w-[120px]"
        >
          {isUploading ? (
            'Uploading...'
          ) : selectedFiles.length > 0 ? (
            <>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>
              Skip to Theme <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}