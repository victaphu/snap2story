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
  
  const content = isValidKey ? (
    <ClerkProvider 
      publishableKey={publishableKey}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#C9B3E5",
        }
      }}
    >
      <PreviewProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </PreviewProvider>
      <Toaster />
    </ClerkProvider>
  ) : (
    <>
      <PreviewProvider>
        <AppLayout>
          {children}
        </AppLayout>
      </PreviewProvider>
      <Toaster />
    </>
  );
  
  return (
    <html lang="en">
      <body className="antialiased">
        {content}
      </body>
    </html>
  );
}
