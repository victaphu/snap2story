'use client';

import { SignUp } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function Page() {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidClerk = publishableKey && publishableKey !== '' && !publishableKey.includes('placeholder');

  if (!hasValidClerk) {
    return <PlaceholderSignUp />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Join StoryMosaic
          </h1>
          <p className="text-muted-foreground">
            Create an account to start making your personalized stories
          </p>
        </div>
        <SignUp 
          routing="hash"
          appearance={{
            elements: {
              card: "shadow-lg",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
            }
          }}
        />
      </div>
    </div>
  );
}

function PlaceholderSignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <p className="text-muted-foreground">
            Authentication is being set up
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-8 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              Clerk authentication is not configured yet. 
            </p>
            <p className="text-xs text-muted-foreground">
              Please add your Clerk publishable key to continue.
            </p>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}