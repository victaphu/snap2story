'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Download, Edit, ShoppingCart, Star, Clock, Package, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { PRICING } from '@/lib/constants';

interface BookOption {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  deliveryTime: string;
  recommended?: boolean;
}

const bookOptions: BookOption[] = [
  {
    id: 'pdf',
    name: 'Digital PDF',
    price: PRICING.PDF,
    description: 'Instant download, perfect for sharing',
    features: [
      'High-quality PDF file',
      'Instant download',
      'Print at home',
      'Share digitally',
    ],
    deliveryTime: 'Instant',
  },
  {
    id: 'softcover',
    name: 'Softcover Book',
    price: PRICING.SOFTCOVER,
    description: 'Professional paperback printing',
    features: [
      'Premium paperback',
      'Professional binding',
      'Matte finish cover',
      'Ships worldwide',
    ],
    deliveryTime: '5-7 business days',
    recommended: true,
  },
  {
    id: 'hardcover',
    name: 'Hardcover Book',
    price: PRICING.HARDCOVER,
    description: 'Luxury hardcover edition',
    features: [
      'Premium hardcover',
      'Dust jacket included',
      'Glossy finish',
      'Gift-ready packaging',
    ],
    deliveryTime: '7-10 business days',
  },
];

export function BookReadyContent() {
  const searchParams = useSearchParams();
  const storyId = searchParams.get('storyId');
  const storyType = searchParams.get('type') || 'ai';
  
  const [story, setStory] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string>('softcover');
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    const loadStory = () => {
      try {
        let storyData = null;
        
        if (storyType === 'custom') {
          const savedStory = sessionStorage.getItem('custom_story');
          if (savedStory) {
            storyData = JSON.parse(savedStory);
          }
        } else {
          // For AI stories, would load from database
          const savedStory = sessionStorage.getItem('ai_story');
          if (savedStory) {
            storyData = JSON.parse(savedStory);
          } else {
            // Fallback for demo
            storyData = {
              title: 'Your Amazing AI Story',
              type: 'ai',
              pages: Array.from({ length: 20 }, (_, i) => ({
                id: `page-${i}`,
                pageNumber: i + 1,
                type: 'content',
                text: `This is page ${i + 1} of your AI-generated story.`,
                imageUrl: undefined,
              })),
            };
          }
        }
        
        setStory(storyData);
      } catch (error) {
        toast.error('Failed to load story');
      } finally {
        setIsLoading(false);
      }
    };

    loadStory();
  }, [storyId, storyType]);

  const handleOrder = async () => {
    if (!selectedOption) {
      toast.error('Please select a book format');
      return;
    }

    setIsOrdering(true);
    try {
      // TODO: Implement Stripe payment
      const option = bookOptions.find(opt => opt.id === selectedOption);
      
      // Simulate order processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create order record
      const orderData = {
        id: `order-${Date.now()}`,
        storyId,
        storyTitle: story?.title,
        format: option?.name,
        price: option?.price,
        status: 'processing',
        created_at: new Date().toISOString(),
      };
      
      // Store order (would save to database)
      const existingOrders = JSON.parse(sessionStorage.getItem('orders') || '[]');
      sessionStorage.setItem('orders', JSON.stringify([...existingOrders, orderData]));
      
      toast.success(`Order placed! Your ${option?.name} will be ready ${option?.deliveryTime.toLowerCase()}.`);
      
      // Redirect to orders page
      window.location.href = '/orders';
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!story) {
    return (
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Story Not Found</h1>
        <p className="text-muted-foreground">The story you&apos;re looking for doesn&apos;t exist.</p>
        <Button asChild>
          <Link href="/create">Create New Story</Link>
        </Button>
      </div>
    );
  }

  const totalPages = story.pages?.length || 0;
  const imagesCount = story.pages?.filter((p: any) => p.imageUrl).length || 0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={storyType === 'custom' ? '/create/custom/preview' : '/create/processing'}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Your Book is Ready!</h1>
          <p className="text-muted-foreground">
            Choose how you&apos;d like to receive your personalized story
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Story Preview */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                {story.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Book Cover Preview */}
              <div className="aspect-[3/4] bg-gradient-to-br from-cream to-white rounded-lg border-2 border-muted p-4 flex flex-col items-center justify-center text-center">
                {story.pages?.[0]?.imageUrl ? (
                  <Image 
                    src={story.pages[0].imageUrl} 
                    alt="Book cover"
                    width={300}
                    height={400}
                    className="w-full h-3/4 object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-3/4 bg-muted rounded flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="mt-2">
                  <h3 className="font-bold text-sm">{story.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {storyType === 'custom' ? 'Custom Story' : 'AI-Generated Story'}
                  </p>
                </div>
              </div>

              {/* Story Stats */}
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{totalPages}</div>
                  <div className="text-sm text-muted-foreground">Pages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{imagesCount}</div>
                  <div className="text-sm text-muted-foreground">Images</div>
                </div>
              </div>

              {/* Story Type Badge */}
              <div className="text-center">
                <Badge variant="secondary" className="capitalize">
                  {storyType} Story
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase Options */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Choose Your Format</h2>
            
            <div className="grid gap-4">
              {bookOptions.map((option) => (
                <Card 
                  key={option.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedOption === option.id ? 'ring-2 ring-primary shadow-md' : ''
                  } ${option.recommended ? 'border-primary/50' : ''}`}
                  onClick={() => setSelectedOption(option.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{option.name}</h3>
                          {option.recommended && (
                            <Badge variant="default" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{option.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{option.deliveryTime}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>Professional quality</span>
                          </div>
                        </div>
                        
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {option.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="w-1 h-1 bg-primary rounded-full" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          ${option.price}
                        </div>
                        {selectedOption === option.id && (
                          <div className="text-sm text-primary font-medium mt-1">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            {selectedOption && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Story: {story.title}</span>
                      <span className="text-muted-foreground">
                        {storyType === 'custom' ? 'Custom' : 'AI-Generated'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Format: {bookOptions.find(opt => opt.id === selectedOption)?.name}</span>
                      <span className="font-semibold">
                        ${bookOptions.find(opt => opt.id === selectedOption)?.price}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Total</span>
                        <span>${bookOptions.find(opt => opt.id === selectedOption)?.price}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href={storyType === 'custom' ? '/create/custom' : '/create/describe'}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Story
                </Link>
              </Button>
              
              {selectedOption === 'pdf' && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // TODO: Generate and download PDF
                    toast.success('PDF download will start shortly!');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              )}
              
              <Button
                onClick={handleOrder}
                disabled={!selectedOption || isOrdering}
                className="flex-1"
                size="lg"
              >
                {isOrdering ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Order Now - ${bookOptions.find(opt => opt.id === selectedOption)?.price}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}