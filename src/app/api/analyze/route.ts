import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BrandAnalysisRequest, BrandAnalysisResponse, BrandAnalysisWithMetadata } from '@/types/brand-analysis';
import { extractMultipleSchemas } from '@/lib/schema-extractor';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are an analyst helping summarize and optimize brand visibility.
Perform a web search and return **strictly valid JSON**.

Use the following **explicit schema**:
{
  "known": string[],
  "sentiment_by_channel": { "web":number, "news":number, "forums":number, "social":number },
  "swot": { 
    "s": [{"summary":string, "rationale":string, "citations":string[]}], 
    "w": [{"summary":string, "rationale":string, "citations":string[]}], 
    "o": [{"summary":string, "rationale":string, "citations":string[]}], 
    "t": [{"summary":string, "rationale":string, "citations":string[]}] 
  },
  "competitive_ranking": [{"brand":string, "scores":{"sentiment":number, "sov":number, "ai_readiness":number, "seo_health":number, "social_resonance":number}, "overall":number, "citations":string[]}],
  "recommendations": [{"title":string, "rationale":string, "channel":"ai"|"seo"|"social", "reach":number, "impact":number, "confidence":number, "effort":number, "citations":string[]}],
  "editorial_ideas": [{"format":"faq"|"blog"|"short_social", "title":string, "angle":string, "outline":string[], "citations":string[]}]
}

Inputs:
- Brand: {brand}
- Competitors: {competitors}
- Region: {region}
- Time window: {since_days} days

Tasks:
1. Summarize what's being said about the brand across web, news, forums, and social.
2. Detect top 5–8 competitors and rationale.
3. Perform a detailed SWOT analysis:
   - Each point must include summary, rationale, and citations.
4. Include a competitive stack ranking table:
   - Score each brand on: sentiment, share of voice, AI-readiness, SEO health, and social resonance.
   - Normalize each score 0–100; provide overall weighted score.
   - Include visualization metadata: suggest badges, bars, or highlights for rankings.
5. Recommend 8–12 opportunities, prioritizing using **RICE scoring** (reach, impact, confidence, effort).
6. Generate 6–10 editorial ideas in **multiple formats** (FAQ pages, blogs, short-form social) with angles and outlines.
7. **Citations are mandatory for every claim, insight, or recommendation.**

Return only valid JSON, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body: BrandAnalysisRequest = await request.json();
    const { brand, competitors = [], region = 'global', sinceDays = 30 } = body;

    if (!brand) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Prepare the prompt with actual values
    const prompt = ANALYSIS_PROMPT
      .replace('{brand}', brand)
      .replace('{competitors}', competitors.join(', '))
      .replace('{region}', region)
      .replace('{since_days}', sinceDays.toString());

    // Call OpenAI - use regular completion for now
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: prompt + '\n\nNote: Please provide analysis based on your training data and general knowledge about the brand and industry. Return only valid JSON.',
        },
      ],
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.3'),
      max_tokens: 4000,
    });

    // Extract the JSON response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    let analysisData: BrandAnalysisResponse;
    try {
      // Try to extract JSON from markdown if present
      let jsonContent = content;
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      analysisData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Extract schema metadata for the main brand and top competitors (optional)
    let metadata = [];
    try {
      const urlsToAnalyze = [
        `https://${brand.toLowerCase().replace(/\s+/g, '')}.com`,
        ...competitors.slice(0, 3).map(comp => `https://${comp.toLowerCase().replace(/\s+/g, '')}.com`),
      ];

      metadata = await extractMultipleSchemas(urlsToAnalyze);
    } catch (schemaError) {
      console.warn('Schema extraction failed, continuing without metadata:', schemaError);
      metadata = [];
    }

    const result: BrandAnalysisWithMetadata = {
      ...analysisData,
      metadata,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Brand analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze brand' },
      { status: 500 }
    );
  }
}

