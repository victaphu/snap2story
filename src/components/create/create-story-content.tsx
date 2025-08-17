'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Upload, Palette, FileText, Sparkles, Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BOOK_STRUCTURE } from '@/lib/constants';

const creationModes = [
  {
    id: 'ai-assisted',
    title: 'AI-Assisted Story',
    description: 'Let AI create a complete 20-page story featuring your photos as characters',
    mobileDescription: 'AI creates a full book',
    icon: Sparkles,
    href: '/create/theme?mode=ai-assisted',
    color: 'bg-gradient-to-br from-primary via-indigo-500 to-purple-500',
    features: ['Choose story theme', 'Upload hero photo', 'Pay $5 for creation', '20 pages automatically generated'],
    recommended: true,
  },
  {
    id: 'custom',
    title: 'Custom Adventure',
    description: 'Create your own story with complete control over content and images',
    mobileDescription: 'You control text and images',
    icon: Palette,
    href: '/create/upload-photo?mode=custom',
    color: 'bg-gradient-to-br from-coral to-pink-500',
    features: ['Upload title image & describe story', 'AI generates sample for $5', 'Full editing control', 'Perfect for specific stories'],
    recommended: false,
  },
  {
    id: 'editor',
    title: 'Editor Mode',
    description: 'Plan and refine your book with a guided, chat-based editor',
    mobileDescription: 'Chat to craft your book',
    icon: Wand2,
    href: '/create/editor',
    color: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
    features: [
      'Chat to shape plot & tone',
      'Outline scenes & pages',
      'Iterate quickly with AI',
      'Full creative control',
    ],
    recommended: false,
  },
];

const aiSteps = [
  {
    step: 1,
    title: 'Choose Theme',
    description: 'Select story style',
  },
  {
    step: 2,
    title: 'Upload Photo',
    description: 'Hero image + name',
  },
  {
    step: 3,
    title: 'Pay & Create',
    description: '$5 for full story',
  },
  {
    step: 4,
    title: 'Complete Book',
    description: '20-page masterpiece',
  },
];

export function CreateStoryContent() {
  const { user } = useUser();

  return (
    <div className="space-y-2 sm:space-y-8 min-h-screen flex flex-col pb-16 pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="text-center space-y-1 sm:space-y-4 px-2 sm:px-4 pt-1 sm:pt-0">
        <h1 className="text-xl sm:text-5xl font-bold tracking-tight">
          Create Your Story
        </h1>
        <p className="text-xs sm:text-2xl text-muted-foreground/90 max-w-3xl mx-auto font-medium leading-tight sm:leading-relaxed">
          Choose how you&apos;d like to create your personalized picture book
        </p>
      </div>

      {/* Creation Mode Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-8 max-w-6xl mx-auto px-3 sm:px-4 flex-1">
        {creationModes.map((mode) => {
          const Icon = mode.icon;
          
          return (
            <Card 
              key={mode.id} 
              className={`group hover:shadow-lg transition-shadow duration-200 relative ${
                mode.recommended ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              {mode.recommended && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                    Recommended
                  </span>
                </div>
              )}
              
              <CardContent className="p-3 pb-2 sm:p-8 sm:pb-8 space-y-2 sm:space-y-6">
                {/* Icon and Title */}
                <div className="text-center space-y-1 sm:space-y-4">
                  <div className={`w-12 h-12 sm:w-24 sm:h-24 rounded-lg ${mode.color} flex items-center justify-center mx-auto transition-colors duration-200`}>
                    <Icon className="h-6 w-6 sm:h-12 sm:w-12 text-white" />
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-3">
                    <h3 className="text-base sm:text-3xl font-bold transition-colors leading-tight">
                      {mode.title}
                    </h3>
                    <p className="text-xs sm:text-xl text-muted-foreground/80 font-medium leading-tight sm:leading-relaxed">
                      <span className="sm:hidden">{(mode as any).mobileDescription || mode.description}</span>
                      <span className="hidden sm:inline">{mode.description}</span>
                    </p>
                  </div>
                </div>

                {/* Features - Show first 3 on mobile, all on desktop */}
                <div className="space-y-0.5 sm:space-y-4">
                  {mode.features.map((feature, index) => (
                    <div key={index} className={`flex items-center gap-1.5 ${index > 1 ? 'hidden sm:flex' : ''}`}>
                      <div className="w-1 h-1 sm:w-3 sm:h-3 rounded-full bg-primary flex-shrink-0"></div>
                      <span className="text-xs sm:text-lg text-muted-foreground/90 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Action */}
                <Button 
                  asChild 
                  className="w-full h-10 text-sm sm:h-16 sm:text-xl py-2 sm:py-6 px-4 sm:px-8 font-bold" 
                  variant={mode.recommended ? 'default' : 'outline'}
                >
                  <Link href={mode.href}>
                    Start
                    <span className="hidden sm:inline"> {mode.title}</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Cards - How It Works & What You'll Get */}
      <div className="space-y-8 max-w-4xl mx-auto hidden sm:block">
        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center space-x-8">
              {aiSteps.map((step, index) => (
                <div key={step.step} className="text-center space-y-2 relative">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                    {step.step}
                  </div>
                  <h4 className="font-semibold text-sm">{step.title}</h4>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                  {index < aiSteps.length - 1 && (
                    <div className="hidden md:block absolute w-16 h-px bg-border top-6 left-[calc(100%+1rem)]"></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What You'll Get */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
              What You&apos;ll Get
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                  {BOOK_STRUCTURE.IMAGE_PAGES}
                </div>
                <h4 className="font-semibold">AI Illustrations</h4>
                <p className="text-sm text-muted-foreground">
                  Beautiful, personalized artwork featuring your photos
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                  {BOOK_STRUCTURE.TEXT_PAGES}
                </div>
                <h4 className="font-semibold">Story Pages</h4>
                <p className="text-sm text-muted-foreground">
                  Engaging narrative with your characters as the heroes
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                  2
                </div>
                <h4 className="font-semibold">Covers</h4>
                <p className="text-sm text-muted-foreground">
                  Professional front and back covers for your book
                </p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Total:</strong> {BOOK_STRUCTURE.TOTAL_PAGES} pages • 
                <strong> Time:</strong> ~2-3 minutes to generate • 
                <strong> Formats:</strong> PDF, Softcover, Hardcover
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
