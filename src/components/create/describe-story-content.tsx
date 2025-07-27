'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mic, MicOff, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LIMITS } from '@/lib/constants';

export function DescribeStoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = searchParams.get('theme');
  
  const [storyDescription, setStoryDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setStoryDescription(prev => {
          const newText = prev + transcript;
          return newText.slice(0, LIMITS.PROMPT_MAX_LENGTH);
        });
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast.error('Speech recognition failed. Please try typing instead.');
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognition);
    }
  }, []);

  const handleVoiceToggle = () => {
    if (!recognition) {
      toast.error('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
      toast.info('Listening... Speak your story description');
    }
  };

  const handleGenerate = async () => {
    if (storyDescription.trim().length < LIMITS.PROMPT_MIN_LENGTH) {
      toast.error(`Please write at least ${LIMITS.PROMPT_MIN_LENGTH} characters`);
      return;
    }

    setIsLoading(true);
    try {
      // Store story description
      const storyData = {
        description: storyDescription.trim(),
        theme,
        timestamp: Date.now()
      };
      sessionStorage.setItem('story_description', JSON.stringify(storyData));
      
      toast.success('Story description saved! Starting generation...');
      router.push('/create/processing');
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getThemePrompts = () => {
    switch (theme) {
      case 'bedtime':
        return [
          'A magical bedtime adventure where the heroes discover a secret world in their dreams',
          'The heroes help sleepy forest animals find their way home before bedtime',
          'A gentle story about overcoming nighttime fears with courage and friendship'
        ];
      case 'family-adventures':
        return [
          'A fun family camping trip where everyone works together to solve a puzzle',
          'The heroes go on a treasure hunt in their own backyard',
          'A day at the beach where the family discovers something amazing'
        ];
      case 'celebrations':
        return [
          'A birthday party adventure where the heroes plan the perfect surprise',
          'The heroes help organize a wonderful holiday celebration',
          'A special anniversary where memories come to life'
        ];
      case 'travel':
        return [
          'An exciting journey to a new country where the heroes learn about different cultures',
          'A road trip adventure with unexpected stops and discoveries',
          'The heroes travel through time to visit historical places'
        ];
      case 'visiting-places':
        return [
          'A visit to grandparents where the heroes discover family history',
          'An adventure at a museum where exhibits come to life',
          'A trip to a farm where the heroes learn about animals and nature'
        ];
      default:
        return [
          'An adventure where the heroes save the day with kindness and teamwork',
          'A magical journey where the heroes discover special powers within themselves',
          'A fun story where the heroes learn an important lesson through their adventure'
        ];
    }
  };

  const characterCount = storyDescription.length;
  const isValid = characterCount >= LIMITS.PROMPT_MIN_LENGTH && characterCount <= LIMITS.PROMPT_MAX_LENGTH;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/create/theme">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Describe Your Story</h1>
          <p className="text-muted-foreground">
            Tell us what kind of story you want to create. You can type or use voice input.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <span className="ml-2 text-sm text-primary font-medium">Photos</span>
        </div>
        <div className="w-16 h-px bg-border"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            ✓
          </div>
          <span className="ml-2 text-sm text-primary font-medium">Theme</span>
        </div>
        <div className="w-16 h-px bg-border"></div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
            3
          </div>
          <span className="ml-2 text-sm font-medium text-primary">Describe Story</span>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Story input */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="story-description" className="text-lg font-semibold">
                  Describe your story
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVoiceToggle}
                  className={isListening ? 'text-red-600 border-red-600' : ''}
                >
                  {isListening ? (
                    <>
                      <MicOff className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4 mr-2" />
                      Speak
                    </>
                  )}
                </Button>
              </div>
              
              <Textarea
                id="story-description"
                placeholder="Describe your story... What adventure should the heroes go on? What should they discover or learn? Be creative!"
                value={storyDescription}
                onChange={(e) => setStoryDescription(e.target.value)}
                className="min-h-[200px] text-base"
                maxLength={LIMITS.PROMPT_MAX_LENGTH}
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className={characterCount < LIMITS.PROMPT_MIN_LENGTH ? 'text-orange-600' : 'text-muted-foreground'}>
                  {characterCount < LIMITS.PROMPT_MIN_LENGTH 
                    ? `Need ${LIMITS.PROMPT_MIN_LENGTH - characterCount} more characters`
                    : `${characterCount}/${LIMITS.PROMPT_MAX_LENGTH} characters`
                  }
                </span>
                {isListening && (
                  <span className="text-red-600 animate-pulse">
                    🔴 Listening...
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tips and suggestions */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold">Story Ideas</h3>
              </div>
              
              <div className="space-y-3">
                {getThemePrompts().map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setStoryDescription(prompt)}
                    className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="font-semibold">Tips for great stories:</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Include what the heroes should learn or discover</li>
                <li>• Mention specific settings or locations</li>
                <li>• Add emotions or challenges to overcome</li>
                <li>• Keep it age-appropriate and positive</li>
                <li>• Let your imagination run wild!</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Theme: <span className="font-medium capitalize">{theme?.replace('-', ' ')}</span>
        </div>
        
        <Button 
          onClick={handleGenerate}
          disabled={!isValid || isLoading}
          className="min-w-[150px]"
          size="lg"
        >
          {isLoading ? (
            'Starting Generation...'
          ) : (
            'Create My Book!'
          )}
        </Button>
      </div>
    </div>
  );
}