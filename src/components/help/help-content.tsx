'use client';

import { useState } from 'react';
import { Search, MessageCircle, Mail, Phone, ChevronDown, ChevronRight, Book, Upload, Palette, FileText, CreditCard, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    questions: [
      {
        q: 'How do I create my first story?',
        a: 'There are two ways to create stories: 1) AI-Assisted: Choose a theme, upload your hero\'s photo, provide their name, then pay $5 for full story generation. 2) Custom: Upload an image, describe your story, pay $5, then use our editor for complete control. Both methods create beautiful, personalized books!'
      },
      {
        q: 'What\'s the difference between AI-Assisted and Custom stories?',
        a: 'AI-Assisted stories use themes and generate 20 pages automatically with your hero as the main character. Custom stories give you complete control - you can create up to 10 pages with your own text and images. Choose AI-Assisted for quick, theme-based stories or Custom for unique, personal narratives.'
      },
      {
        q: 'What types of photos work best?',
        a: 'Use clear, well-lit photos where faces are visible. For AI-Assisted stories, upload one hero photo showing the character clearly. For Custom stories, upload a title image that represents your story. Photos should be high-quality and well-cropped for best results.'
      },
      {
        q: 'How long does it take to create a book?',
        a: 'After payment, AI-Assisted stories generate in 2-3 minutes with 20 pages (10 illustrations + 10 text pages + covers). Custom stories depend on how long you spend in the editor, but most users complete their books in 15-30 minutes.'
      },
      {
        q: 'Do I need to pay before seeing my story?',
        a: 'No! We generate a 3-page sample for free first. You\'ll see a preview of your cover and two content pages. Only if you love the sample do you pay $5 to generate the complete story.'
      },
      {
        q: 'Can I edit my story after it\'s generated?',
        a: 'Yes! AI-Assisted stories can be edited and you can even convert them to Custom format for full control. Custom stories are fully editable by design. You can modify text, replace images, and adjust layouts anytime.'
      }
    ]
  },
  {
    id: 'photos-upload',
    title: 'Photos & Upload',
    icon: Upload,
    questions: [
      {
        q: 'What file formats are supported?',
        a: 'We support PNG, JPG, and JPEG files. Each image must be under 10MB in size. Make sure photos are clear and well-lit for best AI generation results.'
      },
      {
        q: 'How many photos can I upload?',
        a: 'For AI-Assisted mode, upload one clear photo of your hero (person or pet). For Custom mode, you can upload a title image plus additional images throughout the editing process.'
      },
      {
        q: 'What makes a good hero photo for AI-Assisted mode?',
        a: 'Use photos where the face is clearly visible, well-lit, and unobstructed. The person or pet should be the main focus. Avoid group photos or photos with heavy filters.'
      },
      {
        q: 'Can I upload photos of pets?',
        a: 'Absolutely! Our AI loves creating stories featuring pets as heroes. Dogs, cats, and other pets make wonderful story characters.'
      },
      {
        q: 'What if my photo upload fails?',
        a: 'Check that your image is under 10MB and in PNG/JPG format. If it still fails, try using a different photo or contact support for help.'
      },
      {
        q: 'Can I change photos after uploading?',
        a: 'You can go back and upload a different photo before paying for story generation. After payment, you can edit the story but the original hero photo will remain.'
      }
    ]
  },
  {
    id: 'themes-customization',
    title: 'Themes & Customization',
    icon: Palette,
    questions: [
      {
        q: 'What themes are available for AI-Assisted stories?',
        a: 'We offer Bedtime Stories, Family Adventures, Celebrations, Travel Adventures, Visiting Places, and Custom themes. Each theme provides a unique storytelling framework and visual style.'
      },
      {
        q: 'When do I choose a theme?',
        a: 'For AI-Assisted mode, you choose your theme first before uploading photos. For Custom mode, you can select any theme or skip to full customization.'
      },
      {
        q: 'Can I change the theme after selection?',
        a: 'You can go back and change your theme before paying for story generation. After payment, the theme influences the story style but you can still edit content.'
      },
      {
        q: 'What\'s the difference between themes and custom mode?',
        a: 'Themes provide structured story templates with preset prompts and styles. Custom mode gives you complete control to create any story from scratch with your own text and images.'
      },
      {
        q: 'Do I need to provide a description for AI-Assisted stories?',
        a: 'No! For AI-Assisted mode, just provide your hero\'s name and the theme handles the rest. You can optionally add details, but themes come with built-in story prompts.'
      },
      {
        q: 'How much can I customize an AI-Assisted story?',
        a: 'After generation, you can edit text, modify scenes, and even convert to Custom mode for full control. The initial theme provides the foundation, but you have final creative control.'
      }
    ]
  },
  {
    id: 'books-printing',
    title: 'Books & Printing',
    icon: FileText,
    questions: [
      {
        q: 'What book formats are available?',
        a: 'You can download a PDF ($5), order a softcover print ($25), or hardcover print ($50). All books are 22 pages total (front cover + 20 content pages + back cover).'
      },
      {
        q: 'What\'s included in the $5 story creation fee?',
        a: 'The $5 fee covers AI story generation and gives you a complete digital book saved to your library. Physical printing (softcover $25, hardcover $50) is optional and ordered separately.'
      },
      {
        q: 'What\'s the difference between softcover and hardcover?',
        a: 'Softcover books have a flexible cover and are perfect for everyday reading. Hardcover books have a durable board cover, ideal for gifts or keepsakes. Both have the same interior quality.'
      },
      {
        q: 'How long does printing and shipping take?',
        a: 'Softcover books print and ship in 3-5 business days, hardcover books in 5-7 business days. You\'ll receive tracking information once your order ships via email.'
      },
      {
        q: 'Can I order multiple copies?',
        a: 'Yes! You can order multiple copies during checkout or return to your library anytime to order additional copies. Each book is printed on-demand for the best quality.'
      },
      {
        q: 'What if I\'m not satisfied with my printed book?',
        a: 'We offer a satisfaction guarantee. If you\'re not happy with print quality, contact support within 30 days for a replacement. Digital content refunds are handled within 24 hours of creation.'
      },
      {
        q: 'Can I preview my book before ordering prints?',
        a: 'Yes! After story creation, you can view your complete digital book and make any edits before ordering physical copies. What you see is exactly what gets printed.'
      }
    ]
  },
  {
    id: 'billing-account',
    title: 'Billing & Account',
    icon: CreditCard,
    questions: [
      {
        q: 'Is there a subscription fee?',
        a: 'No! StoryMosaic is completely free to use. You only pay $5 when you want to generate a complete story, plus optional printing costs for physical books.'
      },
      {
        q: 'What does the $5 story creation fee include?',
        a: 'The $5 fee covers AI story generation, digital book creation, and permanent storage in your library. You get a complete 20-page story with illustrations that you can edit and reorder anytime.'
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, PayPal, Apple Pay, and Google Pay through our secure payment processor Stripe. All payments are processed securely and your information is never stored.'
      },
      {
        q: 'Can I get a refund on story creation?',
        a: 'Yes! We offer a 24-hour money-back guarantee on story creation. If you\'re not satisfied with your generated story, contact support within 24 hours for a full refund.'
      },
      {
        q: 'What about refunds on printed books?',
        a: 'Printed books can be refunded or replaced within 30 days if there are quality issues. We stand behind our printing quality and want you to love your physical books.'
      },
      {
        q: 'Do you store my payment information?',
        a: 'No, we don\'t store any payment information. All transactions are processed securely through Stripe, and you\'ll enter payment details fresh for each purchase.'
      },
      {
        q: 'How do I view my purchase history?',
        a: 'You can see all your stories and purchases in your Library and Account Settings pages. We keep a complete history of your creations and orders.'
      },
      {
        q: 'How do I delete my account?',
        a: 'You can delete your account from the Account Settings page under "Danger Zone." This will permanently remove all your stories, data, and purchase history.'
      }
    ]
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: MessageCircle,
    questions: [
      {
        q: 'My story generation is taking longer than expected',
        a: 'Story generation typically takes 2-5 minutes. If it\'s been longer than 10 minutes, try refreshing the page or contact support. Your payment is protected and we\'ll ensure you get your story.'
      },
      {
        q: 'I\'m having trouble uploading my photo',
        a: 'Make sure your image is under 10MB and in PNG, JPG, or JPEG format. Clear your browser cache, try a different browser, or use a different photo. Contact support if the issue persists.'
      },
      {
        q: 'The AI generated content I don\'t like',
        a: 'You can edit any part of your story after generation! Change text, regenerate specific pages, or convert to Custom mode for full control. We also offer a 24-hour refund if you\'re not satisfied.'
      },
      {
        q: 'My payment went through but I don\'t see my story',
        a: 'Check your Library page - stories are automatically saved there. If it\'s missing, contact support with your payment confirmation and we\'ll help immediately.'
      },
      {
        q: 'The website is loading slowly or not working',
        a: 'Try clearing your browser cache, disabling browser extensions, or using a different browser. Check our status page for any known issues, or contact support for help.'
      }
    ]
  },
  {
    id: 'creative-tips',
    title: 'Creative Tips',
    icon: Sparkles,
    questions: [
      {
        q: 'How can I make my AI-generated story more personal?',
        a: 'Use specific details about your hero when providing their name - like "Adventure-loving Emma" or "Brave puppy Max." After generation, edit the story to add personal touches, inside jokes, or specific locations.'
      },
      {
        q: 'What makes a great custom story?',
        a: 'Start with a clear beginning, middle, and end. Include emotions, challenges, and growth. Use vivid descriptions and make your hero relatable. Don\'t forget to include a satisfying conclusion!'
      },
      {
        q: 'How do I choose the right theme?',
        a: 'Consider your audience: Bedtime themes work great for calming stories, Family Adventures for togetherness, Celebrations for special occasions. When in doubt, Custom gives you complete freedom.'
      },
      {
        q: 'Tips for better photo selection?',
        a: 'Choose photos with good lighting, clear faces, and simple backgrounds. Avoid busy or cluttered images. Photos with genuine expressions work better than posed shots for creating engaging stories.'
      },
      {
        q: 'How can I involve my child in the creation process?',
        a: 'Let them choose the theme, help describe what they want in the story, and review the generated content together. Use the editing features to incorporate their ideas and make it truly collaborative!'
      }
    ]
  }
];

const supportOptions = [
  {
    title: 'Live Chat',
    description: 'Get instant help from our support team',
    icon: MessageCircle,
    action: 'Start Chat',
    available: 'Available 9 AM - 6 PM EST',
  },
  {
    title: 'Email Support',
    description: 'Send us a detailed message',
    icon: Mail,
    action: 'Send Email',
    available: 'Response within 24 hours',
  },
  {
    title: 'Phone Support',
    description: 'Call us for urgent issues',
    icon: Phone,
    action: 'Call Now',
    available: 'Mon-Fri 9 AM - 5 PM EST',
  },
];

export function HelpContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setTimeout(() => {
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => 
    selectedCategory === '' || 
    category.id === selectedCategory ||
    category.questions.length > 0
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Find answers to common questions or get in touch with our support team
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Categories Sidebar */}
        <div className="space-y-2">
          <h2 className="font-semibold mb-4">Categories</h2>
          <Button
            variant={selectedCategory === '' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => {
              setSelectedCategory('');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            All Topics
          </Button>
          {faqCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => scrollToCategory(category.id)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.title}
              </Button>
            );
          })}
        </div>

        {/* FAQ Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need More Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supportOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <div key={option.title} className="text-center space-y-3 p-4 border rounded-lg">
                      <Icon className="h-8 w-8 mx-auto text-primary" />
                      <div>
                        <h3 className="font-semibold">{option.title}</h3>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{option.available}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => {
                          if (option.title === 'Live Chat') {
                            // TODO: Implement chat widget
                            alert('Chat widget would open here');
                          } else if (option.title === 'Email Support') {
                            window.location.href = 'mailto:support@storymosaic.com';
                          } else if (option.title === 'Phone Support') {
                            window.location.href = 'tel:+1-555-0123';
                          }
                        }}
                      >
                        {option.action}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* FAQ Sections */}
          {filteredFAQs.map((category) => (
            <Card key={category.id} id={`category-${category.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {category.questions.length === 0 ? (
                  <p className="text-muted-foreground">No questions found matching your search.</p>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {category.questions.map((faq, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Additional Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Video Tutorials</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch step-by-step guides for creating your first story
                  </p>
                  <Button variant="outline" size="sm">
                    View Tutorials
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Best Practices</h3>
                  <p className="text-sm text-muted-foreground">
                    Tips for creating the most engaging stories
                  </p>
                  <Button variant="outline" size="sm">
                    Read Guide
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Community Forum</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with other storytellers and share ideas
                  </p>
                  <Button variant="outline" size="sm">
                    Join Forum
                  </Button>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Status Page</h3>
                  <p className="text-sm text-muted-foreground">
                    Check current system status and maintenance updates
                  </p>
                  <Button variant="outline" size="sm">
                    View Status
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}