'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Moon, Users, PartyPopper, MapPin, Plane, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { THEMES } from '@/lib/constants';
import { ProgressSteps } from './progress-steps';

const themeIcons = {
  bedtime: Moon,
  'family-adventures': Users,
  celebrations: PartyPopper,
  travel: Plane,
  'visiting-places': MapPin,
  custom: Sparkles,
};

export function ChooseThemeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const skippedUpload = searchParams.get('skip_upload') === 'true';
  const sampleId = searchParams.get('sampleId');
  const mode = searchParams.get('mode');
  
  const [selectedTheme, setSelectedTheme] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleThemeSelect = (themeSlug: string) => {
    setSelectedTheme(themeSlug);
  };

  const handleNext = async () => {
    if (!selectedTheme) {
      toast.error('Please select a theme to continue');
      return;
    }

    setIsLoading(true);
    try {
      // Store selected theme
      const themeData = THEMES.find(t => t.slug === selectedTheme);
      sessionStorage.setItem('selected_theme', JSON.stringify(themeData));
      
      // Check for new AI-assisted workflow (theme first)
      if (mode === 'ai-assisted' && !sampleId) {
        // Go to upload photo page with theme for AI-assisted mode
        router.push(`/create/upload-photo?mode=ai-assisted&theme=${selectedTheme}`);
      } else if (sampleId && mode === 'ai-assisted') {
        // Update the sample with selected theme (old workflow)
        const savedSample = sessionStorage.getItem('story_sample');
        if (savedSample) {
          const sampleData = JSON.parse(savedSample);
          sampleData.selectedTheme = selectedTheme;
          sessionStorage.setItem('story_sample', JSON.stringify(sampleData));
        }
        
        // Go to payment page for AI-assisted with theme selected
        router.push(`/create/payment?sampleId=${sampleId}&mode=${mode}&theme=${selectedTheme}`);
      } else if (selectedTheme === 'custom') {
        // For custom theme, redirect to custom editor
        router.push('/create/custom');
      } else {
        // For legacy workflow, go to describe page with theme
        router.push(`/create/describe?theme=${selectedTheme}`);
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link href={mode === 'ai-assisted' && !sampleId ? '/create' : (sampleId ? '/create/title-page' : '/create/upload')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Choose a Theme</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {mode === 'ai-assisted' && !sampleId
            ? 'Select a story theme to get started with AI-assisted creation'
            : sampleId 
              ? 'Select a theme to customize your story style and mood'
              : `Select a theme that matches the type of story you want to create${skippedUpload ? ' (No photos uploaded - AI will create generic characters)' : ''}`
          }
        </p>
      </div>

      {/* Theme selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {THEMES.map((theme) => {
          const Icon = themeIcons[theme.slug as keyof typeof themeIcons] || Sparkles;
          const isSelected = selectedTheme === theme.slug;
          
          return (
            <Card 
              key={theme.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => handleThemeSelect(theme.slug)}
            >
              <CardContent className="p-6 text-center space-y-4">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-lg mx-auto flex items-center justify-center transition-colors ${
                  isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-gradient-to-br from-primary/10 to-primary/5 text-primary'
                }`}>
                  <Icon className="h-8 w-8" />
                </div>
                
                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-semibold">{theme.name}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    {theme.description}
                  </p>
                </div>
                
                {/* Selection indicator */}
                {isSelected && (
                  <div className="text-sm font-medium text-primary">
                    ✓ Selected
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Theme info */}
      {selectedTheme && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-primary">
                {THEMES.find(t => t.slug === selectedTheme)?.name} Selected
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedTheme === 'custom' 
                  ? 'You\'ll have full control over your story content and can create any adventure you imagine.'
                  : 'AI will create a story tailored to this theme with your characters as the main heroes.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {THEMES.length} themes available
        </div>
        
        <Button 
          onClick={handleNext}
          disabled={!selectedTheme || isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            'Loading...'
          ) : (
            <>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}