'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { Library, HelpCircle, User, BookOpen, Sparkles, Download, Wand2, CheckCircle2, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const homeActions = [
  {
    id: 'create',
    title: 'Create a New Story',
    description: 'Upload photos and let AI create your personalized picture book',
    icon: Wand2,
    href: '/create',
    color: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  },
  {
    id: 'library',
    title: 'View My Stories',
    description: 'Browse and manage your created stories',
    icon: Library,
    href: '/library',
    color: 'bg-gradient-to-br from-sky-500 to-cyan-500',
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'Get help with creating your stories',
    icon: HelpCircle,
    href: '/help',
    color: 'bg-gradient-to-br from-indigo-500 to-blue-500',
  },
  {
    id: 'account',
    title: 'Account',
    description: 'Manage your profile and preferences',
    icon: User,
    href: '/account',
    color: 'bg-gradient-to-br from-emerald-500 to-teal-500',
  },
];

const landingFeatures = [
  {
    id: 'ai-powered',
    title: 'AI-Powered Stories',
    description: 'Advanced AI creates unique stories and illustrations from your photos',
    icon: Sparkles,
    color: 'bg-gradient-to-br from-primary to-primary/80',
  },
  {
    id: 'personalized',
    title: 'Personalized Books',
    description: 'Every book features your family and friends as the main characters',
    icon: BookOpen,
    color: 'bg-gradient-to-br from-coral to-coral/80',
  },
  {
    id: 'print-ready',
    title: 'Professional Printing',
    description: 'High-quality prints delivered to your door, or download instantly',
    icon: Download,
    color: 'bg-gradient-to-br from-soft-blue to-soft-blue/80',
  },
];

export function HomeContent() {
  // Check if Clerk is properly configured
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerk = publishableKey && publishableKey !== '' && !publishableKey.includes('placeholder');
  
  if (!hasValidClerk) {
    return <LandingPage />;
  }

  return <AuthenticatedWrapper />;
}

function AuthenticatedWrapper() {
  const { isSignedIn, user } = useUser();

  // Show different content for authenticated vs unauthenticated users
  if (!isSignedIn) {
    return <LandingPage />;
  }

  return <AuthenticatedHome user={user} />;
}

function LandingPage() {
  return (
    <div className="space-y-16">
      {/* Hero section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
          Create Magical
          <span className="text-primary block">Picture Books</span>
        </h1>
        <p className="text-xl sm:text-3xl text-muted-foreground/90 max-w-4xl mx-auto px-4 sm:px-0 font-medium leading-relaxed">
          Turn your photos into beautiful picture books featuring your family and friends as heroes.
        </p>
        <div className="flex flex-col gap-6 justify-center pt-6 max-w-md mx-auto">
          <Button size="lg" asChild className="bg-coral hover:bg-coral/90 text-xl py-8 font-bold">
            <Link href="/sign-up">Create Your First Book</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-xl py-8 font-bold border-2">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {landingFeatures.map((feature) => {
          const Icon = feature.icon;
          
          return (
            <Card key={feature.id} className="text-center">
              <CardContent className="p-6 space-y-4">
                <div className={`w-16 h-16 rounded-lg ${feature.color} flex items-center justify-center mx-auto`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground hidden sm:block">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* How it works - Hidden on mobile */}
      <div className="text-center space-y-8 hidden sm:block">
        <h2 className="text-3xl font-bold">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold">
              1
            </div>
            <h3 className="text-lg font-semibold">Upload Your Photos</h3>
            <p className="text-muted-foreground">
              Upload 1-3 photos of your family, friends, or pets to be the heroes of your story
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold">
              2
            </div>
            <h3 className="text-lg font-semibold">Choose Theme & Story</h3>
            <p className="text-muted-foreground">
              Select from themes like bedtime, adventures, or celebrations, then describe your story
            </p>
          </div>
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-xl font-bold">
              3
            </div>
            <h3 className="text-lg font-semibold">Get Your Book</h3>
            <p className="text-muted-foreground">
              AI creates your 20-page book with 10 illustrations and 10 story pages, plus covers
            </p>
          </div>
        </div>
      </div>
      
      {/* Simple mobile version */}
      <div className="text-center space-y-4 sm:hidden">
        <h2 className="text-2xl font-bold">3 Simple Steps</h2>
        <div className="text-sm text-muted-foreground space-y-2">
          <p>📸 Upload photos</p>
          <p>🎨 Choose your theme</p>
          <p>📚 Get your book!</p>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-card rounded-lg p-8 text-center border">
        <h2 className="text-2xl font-bold mb-4">Ready to Create Your Story?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          Join thousands of families creating magical memories with personalized picture books.
        </p>
        <Button size="lg" asChild className="bg-coral hover:bg-coral/90">
          <Link href="/sign-up">Get Started - It&apos;s Free!</Link>
        </Button>
      </div>
    </div>
  );
}

function AuthenticatedHome({ user }: { user: any }) {
  return (
    <div className="space-y-3 sm:space-y-8 pb-16 sm:pb-0 pb-[env(safe-area-inset-bottom)]">
      {/* Welcome back section */}
      <div className="text-center space-y-2 sm:space-y-4 px-2 sm:px-0">
        <h1 className="text-2xl sm:text-5xl font-bold tracking-tight text-foreground">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 
        </h1>
        <p className="text-sm sm:text-2xl text-muted-foreground/90 max-w-3xl mx-auto font-medium leading-tight sm:leading-relaxed">
          Ready to create another magical story?
        </p>
      </div>

      {/* Action cards - Elderly-friendly with larger text and touch targets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 max-w-4xl mx-auto px-2 sm:px-0">
        {homeActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Card 
              key={action.id} 
              className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border-2 hover:border-primary/30 flex flex-col"
            >
              <CardContent className="p-3 sm:p-8 pb-2 sm:pb-6 flex flex-col flex-1">
                <div className="flex-1">
                  <Link href={action.href} className="block space-y-2 sm:space-y-4 text-center sm:text-left">
                    <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-lg ${action.color} flex items-center justify-center transition-transform duration-200 mx-auto sm:mx-0`}>
                      <Icon className="h-6 w-6 sm:h-10 sm:w-10 text-white" />
                    </div>
                    
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="text-base sm:text-2xl font-bold transition-colors leading-tight">
                        {action.title}
                      </h3>
                      <p className="text-xs sm:text-lg text-muted-foreground/80 hidden sm:block font-medium">
                        {action.description}
                      </p>
                    </div>
                  </Link>
                </div>
                
                <Button 
                  asChild
                  variant="default" 
                  className="w-full h-10 sm:h-11 text-sm sm:text-base py-2 sm:py-3 px-4 sm:px-6 font-semibold mt-0 sm:mt-3"
                >
                  <Link href={action.href}>
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* At a glance: brief guidance for clarity */}
      <div className="max-w-4xl mx-auto px-2 sm:px-0 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <Card className="border-2">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
              <Wand2 className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Start a new book</div>
              <div className="text-muted-foreground">Pick a mode that fits: AI-assisted, Editor, or Custom.</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Preview, then continue</div>
              <div className="text-muted-foreground">Generate a cover and outline. Choose free sample or full book.</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white">
              <Info className="h-5 w-5" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Where to find things</div>
              <div className="text-muted-foreground">Your drafts and finished books live in Library. Help is always one tap away.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Book structure info - Simplified for mobile */}
      <div className="text-center space-y-4 pt-4 sm:pt-8 hidden sm:block">
        <div className="bg-card rounded-lg p-6 border max-w-2xl mx-auto">
          <h2 className="text-lg font-semibold mb-2">Your Books Include</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                10
              </div>
              <p>Beautiful AI illustrations</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                10
              </div>
              <p>Story pages with text</p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg font-bold">
                +2
              </div>
              <p>Front & back covers</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile compact version */}
      <div className="sm:hidden text-center px-4">
        <div className="bg-card rounded-lg p-4 border">
          <p className="text-sm text-muted-foreground">
            📚 22-page books with 10 AI illustrations + 10 story pages
          </p>
        </div>
      </div>
    </div>
  );
}
