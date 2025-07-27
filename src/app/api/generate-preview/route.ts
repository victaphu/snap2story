import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getStoryTemplate, generateBookTitle } from '@/lib/story-templates';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { heroName, themeId, heroAnalysis, originalImageBase64 } = await request.json();

    if (!heroName || !themeId || !heroAnalysis) {
      return NextResponse.json(
        { error: 'Hero name, theme, and hero analysis are required' },
        { status: 400 }
      );
    }

    // Get the story template for this theme
    const storyTemplate = getStoryTemplate(themeId);
    if (!storyTemplate) {
      return NextResponse.json(
        { error: 'Invalid theme selected' },
        { status: 400 }
      );
    }

    // Generate the book title with hero's name
    const bookTitle = generateBookTitle(themeId, heroName);

    // Create enhanced prompt using hero analysis
    const heroDescription = `${heroAnalysis.age} with ${heroAnalysis.hairColor} hair, ${heroAnalysis.complexion} complexion, wearing ${heroAnalysis.clothing}`;
    
    const titlePagePrompt = `Create a beautiful children's book front cover illustration. 

Main character: Show ${heroName}, a ${heroDescription}, with a ${heroAnalysis.expression} expression. Include any distinctive features: ${heroAnalysis.distinctiveFeatures}.

Setting: Place ${heroName} in a ${storyTemplate.theme.toLowerCase()} themed scene that represents the story.

Book title: The title "${bookTitle}" should be prominently displayed at the top of the cover in large, colorful, child-friendly lettering that is clearly readable and beautifully integrated into the design.

Art style: Bright, cheerful children's book illustration with vibrant colors, whimsical details, and a magical feel. The cover should be engaging for toddlers and babies. Ensure the character closely matches the description provided while maintaining a child-friendly, storybook aesthetic.

Make sure the title text is large, easy to read, and positioned prominently on the cover. For the text generated please make sure the text fully fits into the page with margin`;

    const titleImageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: titlePagePrompt,
      size: "1024x1024", // Reduced from 1024x1024 to reduce payload size
      quality: "low",
      n: 1
    });

    const generatedImageBase64 = titleImageResponse.data?.[0]?.b64_json;

    if (!generatedImageBase64) {
      return NextResponse.json(
        { error: 'Failed to generate title page' },
        { status: 500 }
      );
    }

    // Log image size for debugging
    const imageSizeKB = Math.round((generatedImageBase64.length * 3) / 4 / 1024);
    console.log(`Generated image size: ${imageSizeKB}KB`);

    // Create data URL for the generated image
    const generatedImageDataUrl = `data:image/png;base64,${generatedImageBase64}`;

    // Create preview data with the generated title page
    const previewData = {
      id: `preview-${Date.now()}`,
      title: bookTitle,
      themeId,
      coverImage: generatedImageDataUrl,
      originalImage: originalImageBase64,
      storyTemplate: storyTemplate,
      heroAnalysis: heroAnalysis,
      pages: [
        {
          id: 'title-page',
          type: 'title',
          title: bookTitle,
          text: `A magical ${storyTemplate.theme.toLowerCase()} story featuring ${heroName}!`,
          imageUrl: generatedImageDataUrl,
        }
      ],
      heroName,
      theme: storyTemplate.theme,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(previewData);

  } catch (error) {
    console.error('Preview generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}