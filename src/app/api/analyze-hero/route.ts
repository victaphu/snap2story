import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const compressedBase64 = formData.get('compressedBase64') as string;
    
    if (!imageFile && !compressedBase64) {
      return NextResponse.json(
        { error: 'Image file or compressed base64 is required' },
        { status: 400 }
      );
    }

    let base64Image: string;
    let mimeType: string;

    if (compressedBase64) {
      // Use pre-compressed base64 if provided
      const [dataPrefix, base64Data] = compressedBase64.split(',');
      base64Image = base64Data;
      mimeType = dataPrefix.match(/:(.*?);/)?.[1] || 'image/jpeg';
    } else {
      // Fallback to original file conversion
      const bytes = await imageFile.arrayBuffer();
      base64Image = Buffer.from(bytes).toString('base64');
      mimeType = imageFile.type;
    }

    // If mocking is enabled, return a canned analysis with the original image
    const MOCK = (process.env.MOCK_ANALYSIS || '').toLowerCase() === 'true';
    if (MOCK) {
      const mockAnalysis = {
        age: 'child',
        hairColor: 'brown',
        eyeColor: 'unknown',
        complexion: 'fair',
        clothing: 'casual',
        expression: 'happy',
        distinctiveFeatures: 'friendly smile',
        suggestedName: 'Alex',
        confidence: 10,
        description: 'A cheerful child with a bright, friendly smile.',
        mockedAnalysis: true,
      };
      return NextResponse.json({
        success: true,
        analysis: mockAnalysis,
        originalImage: `data:${mimeType};base64,${base64Image}`,
      });
    }

    // Analyze the image using GPT-4O Vision
    const analysis = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing photos to create children's book characters. 
          Analyze the main person/character in this image and provide details that will help create a personalized children's book.
          Focus on the most prominent person in the image, especially children or babies.
          Be specific but child-friendly in your descriptions.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image and describe the main person/character for a children's book. Please provide:
              
              1. Age category (baby, toddler, child, adult)
              2. Physical appearance (hair color, eye color if visible, complexion)
              3. Clothing/outfit description
              4. Expression/mood
              5. Any distinctive features
              6. Suggest an appropriate name
              7. Rate your confidence in the analysis (1-10)
              
              Format your response as JSON with these exact keys:
              {
                "age": "age category",
                "hairColor": "hair color",
                "eyeColor": "eye color or unknown",
                "complexion": "skin tone description",
                "clothing": "clothing description",
                "expression": "expression/mood",
                "distinctiveFeatures": "any notable features",
                "suggestedName": "appropriate name",
                "confidence": "number 1-10",
                "description": "one sentence summary description"
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });

    const analysisText = analysis.choices[0]?.message?.content?.trim();
    
    if (!analysisText) {
      return NextResponse.json(
        { error: 'Failed to analyze image' },
        { status: 500 }
      );
    }

    // Parse the JSON response - handle markdown code blocks
    let heroAnalysis;
    try {
      // Clean up the response by removing markdown code blocks
      let cleanedText = analysisText;
      if (cleanedText.includes('```json')) {
        cleanedText = cleanedText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanedText.includes('```')) {
        cleanedText = cleanedText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      heroAnalysis = JSON.parse(cleanedText.trim());
    } catch (parseError) {
      console.error('Failed to parse analysis JSON:', analysisText);
      return NextResponse.json(
        { error: 'Failed to parse image analysis' },
        { status: 500 }
      );
    }

    // Validate required fields
    if (!heroAnalysis.suggestedName || !heroAnalysis.description) {
      return NextResponse.json(
        { error: 'Incomplete image analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: heroAnalysis,
      originalImage: `data:${mimeType};base64,${base64Image}`
    });

  } catch (error) {
    console.error('Hero analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze hero image' },
      { status: 500 }
    );
  }
}
