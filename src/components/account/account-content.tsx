'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { Settings, CreditCard, Bell, MapPin, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function AccountContent() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    marketingEmails: false,
    voiceTips: true,
    autoSave: true,
  });

  const handlePreferenceChange = async (key: string, value: boolean) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    
    // TODO: Save to database
    try {
      // await updateUserPreferences(user?.id, { [key]: value });
      toast.success('Preference updated');
    } catch (error) {
      toast.error('Failed to update preference');
      // Revert the change
      setPreferences(prev => ({ ...prev, [key]: !value }));
    }
  };

  if (!user) {
    return <div>Please sign in to access your account settings.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, preferences, and account security
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <div className="border-b border-border">
          <TabsList className="h-auto p-0 bg-transparent rounded-none border-0 justify-start">
            <TabsTrigger 
              value="profile" 
              className="relative h-12 px-6 rounded-none border-0 bg-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-primary"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="relative h-12 px-6 rounded-none border-0 bg-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-primary"
            >
              Preferences
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="relative h-12 px-6 rounded-none border-0 bg-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-primary"
            >
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="payment-history" 
              className="relative h-12 px-6 rounded-none border-0 bg-transparent hover:bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 data-[state=active]:after:bg-primary"
            >
              Payment History
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl">
                <UserProfile 
                  appearance={{
                    elements: {
                      card: "shadow-none border-0 p-0",
                      navbar: "hidden",
                      navbarMobileMenuButton: "hidden",
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>App Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-save stories</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically save your progress while creating stories
                  </p>
                </div>
                <Switch
                  checked={preferences.autoSave}
                  onCheckedChange={(checked) => handlePreferenceChange('autoSave', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Voice input tips</Label>
                  <p className="text-sm text-muted-foreground">
                    Show helpful tips when using voice input features
                  </p>
                </div>
                <Switch
                  checked={preferences.voiceTips}
                  onCheckedChange={(checked) => handlePreferenceChange('voiceTips', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails about your story generation progress
                  </p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about new features and special offers
                  </p>
                </div>
                <Switch
                  checked={preferences.marketingEmails}
                  onCheckedChange={(checked) => handlePreferenceChange('marketingEmails', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        {/* Payment History Tab */}
        <TabsContent value="payment-history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Recent Book Purchases</h3>
                  <Button variant="outline" size="sm">
                    Download Receipt
                  </Button>
                </div>
                
                {/* Sample payment history - replace with real data */}
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href="/book/1/viewer" 
                        className="font-medium hover:text-primary transition-colors cursor-pointer"
                      >
                        Story Creation - &quot;Adventures with Max&quot;
                      </Link>
                      <span className="text-sm font-medium">$5.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>AI story generation</span>
                      <span>Dec 15, 2024</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Completed
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/book/1/viewer">
                          View Book
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href="/book/2/viewer" 
                        className="font-medium hover:text-primary transition-colors cursor-pointer"
                      >
                        Hardcover Book - &quot;Princess Luna&apos;s Quest&quot;
                      </Link>
                      <span className="text-sm font-medium">$25.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Physical book printing</span>
                      <span>Dec 10, 2024</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Shipped
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/book/2/viewer">
                          View Book
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href="/book/3/viewer" 
                        className="font-medium hover:text-primary transition-colors cursor-pointer"
                      >
                        PDF Download - &quot;Superhero Sam&quot;
                      </Link>
                      <span className="text-sm font-medium">$5.00</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Digital book download</span>
                      <span>Dec 5, 2024</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Downloaded
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/book/3/viewer">
                          View Book
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Empty state - uncomment when no payments exist */}
                {/* <div className="p-8 text-center border rounded-lg">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No payments yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your payment history will appear here after you make your first purchase.
                  </p>
                  <Button asChild>
                    <Link href="/create">Create Your First Story</Link>
                  </Button>
                </div> */}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total spent this year:</span>
                  <span className="font-medium">$35.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Delete Account</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" onClick={() => {
              alert('Account deletion is not implemented yet. Please contact support if you need to delete your account.');
            }}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}