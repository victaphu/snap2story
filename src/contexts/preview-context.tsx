'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface HeroAnalysis {
  age: string;
  hairColor: string;
  eyeColor: string;
  complexion: string;
  clothing: string;
  expression: string;
  distinctiveFeatures: string;
  suggestedName: string;
  confidence: number;
  description: string;
}

interface StoryTemplate {
  id: string;
  theme: string;
  title: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    imageDescription: string;
  }>;
}

interface PreviewData {
  id: string;
  title: string;
  themeId: string;
  coverImage: string;
  originalImage: string;
  storyTemplate: StoryTemplate;
  heroAnalysis?: HeroAnalysis;
  imageInspiration?: string;
  heroName: string;
  theme: string;
  createdAt: string;
}

interface PreviewContextType {
  previewData: PreviewData | null;
  setPreviewData: (data: PreviewData | null) => void;
  clearPreviewData: () => void;
}

const PreviewContext = createContext<PreviewContextType | undefined>(undefined);

export function PreviewProvider({ children }: { children: ReactNode }) {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);

  const clearPreviewData = () => {
    setPreviewData(null);
  };

  return (
    <PreviewContext.Provider value={{ previewData, setPreviewData, clearPreviewData }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}