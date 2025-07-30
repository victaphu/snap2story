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

    // Create enhanced prompt using hero analysis and uploaded image
    const heroDescription = `${heroAnalysis.age} with ${heroAnalysis.hairColor} hair, ${heroAnalysis.complexion} complexion, wearing ${heroAnalysis.clothing}`;
    
    // First, analyze the uploaded image to understand its composition and style
    const visionAnalysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert at analyzing images for children's book creation. Analyze the uploaded image to understand its composition, lighting, background, and overall aesthetic that can inspire a book cover design."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this uploaded image and describe: 1) The background/setting, 2) The lighting and mood, 3) Any interesting compositional elements, 4) The overall aesthetic that would work well for a children's book cover. Be detailed but concise."
            },
            {
              type: "image_url",
              image_url: {
                url: originalImageBase64,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });

    const imageInspiration = visionAnalysis.choices[0]?.message?.content || "bright, cheerful setting";

    // Now use DALL-E with the inspiration from the uploaded image
    const titlePagePrompt = `Create a beautiful children's book front cover illustration inspired by this uploaded image composition and aesthetic: ${imageInspiration}

Main character: Show ${heroName}, a ${heroDescription}, with a ${heroAnalysis.expression} expression. Include any distinctive features: ${heroAnalysis.distinctiveFeatures}. The character should look exactly like the person in the uploaded reference image but rendered in a children's book illustration style.

Setting: Place ${heroName} in a ${storyTemplate.theme.toLowerCase()} themed scene that represents the story, incorporating elements inspired by the uploaded image's background and atmosphere.

Book title: The title "${bookTitle}" should be prominently displayed at the top of the cover in large, colorful, child-friendly lettering that is clearly readable and beautifully integrated into the design.

Art style: Children's book illustration that takes inspiration from the uploaded image's lighting, mood, and composition while maintaining vibrant colors, whimsical details, and a magical feel. The cover should be engaging for toddlers and babies while incorporating the aesthetic elements from the reference photo.

Make sure the title text is large, easy to read, and positioned prominently on the cover. Ensure the character maintains the exact likeness from the uploaded photo while being transformed into a storybook character.`;

    const titleImageResponse = await openai.images.generate({
      model: "gpt-image-1",
      prompt: titlePagePrompt,
      size: "1024x1024",
      quality: "standard",
      n: 1
    });

    const generatedImageUrl = titleImageResponse.data?.[0]?.url;

    if (!generatedImageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate title page' },
        { status: 500 }
      );
    }

    // Download the image from DALL-E 3 URL and convert to base64
    const imageResponse = await fetch(generatedImageUrl);
    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to download generated image' },
        { status: 500 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const generatedImageBase64 = Buffer.from(imageBuffer).toString('base64');

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
      imageInspiration: imageInspiration, // Add the inspiration analysis
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