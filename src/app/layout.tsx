import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/app-layout";
import { PreviewProvider } from "@/contexts/preview-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "StoryMosaic - Create Personalized Picture Books",
  description: "Create beautiful, personalized picture books with AI. Upload photos, choose themes, and bring your stories to life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isValidKey = publishableKey && publishableKey !== '' && !publishableKey.includes('placeholder');
  
  // For development/build without valid Clerk setup
  if (!isValidKey) {
    return (
      <html lang="en">
        <body className="antialiased">
          <PreviewProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </PreviewProvider>
          <Toaster />
        </body>
      </html>
    );
  }
  
  return (
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#C9B3E5",
        }
      }}
    >
      <html lang="en">
        <body className="antialiased">
          <PreviewProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </PreviewProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
