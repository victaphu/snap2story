import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing URL parameter' }, { status: 400 });
    }

    // Validate that it's a proper URL
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Security: Only allow specific domains to prevent abuse
    const allowedDomains = [
      'dashscope-result-sgp.oss-ap-southeast-1.aliyuncs.com', // Qwen CDN
      'dashscope-result-bj.oss-cn-beijing.aliyuncs.com', // Qwen CDN Beijing
      'oaidalleapiprodscus.blob.core.windows.net', // OpenAI DALL-E
      'cdn.openai.com', // OpenAI CDN
    ];

    const urlObj = new URL(imageUrl);
    if (!allowedDomains.includes(urlObj.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Snap2Story/1.0',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch image: ${response.status}` 
      }, { status: response.status });
    }

    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json({ 
      error: 'Failed to proxy image' 
    }, { status: 500 });
  }
}