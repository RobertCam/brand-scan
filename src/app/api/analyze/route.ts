import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BrandAnalysisRequest, BrandAnalysisResponse } from '@/types/brand-analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ANALYSIS_PROMPT = `You are a senior brand analyst providing comprehensive competitive intelligence and strategic recommendations. Analyze the brand and competitors based on your knowledge and return **strictly valid JSON**.

Use the following **explicit schema**:
{
  "brand_profile": {
    "category": string,
    "industry": string,
    "target_audience": string,
    "key_differentiators": string[]
  },
  "executive_summary": string,
  "competitive_landscape": string,
  "sentiment_analysis": {
    "web": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]},
    "news": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]},
    "forums": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]},
    "social": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]}
  },
  "swot_analysis": {
    "strengths": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}],
    "weaknesses": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}],
    "opportunities": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}],
    "threats": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}]
  },
  "competitive_ranking": [{
    "brand": string,
    "overall_score": number,
    "score_breakdown": {
      "sentiment": {"score": number, "explanation": string},
      "share_of_voice": {"score": number, "explanation": string},
      "ai_readiness": {"score": number, "explanation": string},
      "seo_health": {"score": number, "explanation": string},
      "social_resonance": {"score": number, "explanation": string}
    },
    "ranking_justification": string,
    "sources": string[]
  }],
  "editorial_ideas": [{
    "format": "faq"|"blog"|"short_social",
    "title": string,
    "angle": string,
    "brand_tone": string,
    "outline": string[],
    "sample_copy": string
  }]
}

Inputs:
- Brand: {brand}
- Competitors: {competitors}
- Region: {region}
- Time window: {since_days} days

Requirements:
1. **Brand Profile**: Provide category, industry, target audience, and key differentiators for the brand based on your knowledge.

2. **Executive Summary**: Provide a comprehensive 2-3 paragraph overview of the brand's current market position, key challenges, and opportunities.

3. **Competitive Landscape**: Detailed analysis of the competitive environment, market dynamics, and how the brand fits within the ecosystem.

4. **Sentiment Analysis**: For each channel (web, news, forums, social):
   - Provide specific score (0-100) with detailed explanation
   - Include 3-5 key insights with specific examples
   - Include actual clickable URLs as sources (e.g., https://example.com/article) - NO placeholder, example, or descriptive text sources

5. **SWOT Analysis**: Include competitor context for each point:
   - How strengths compare to competitors
   - How weaknesses compare to competitors
   - Opportunities competitors are missing
   - Threats competitors are facing
   - Include actual clickable URLs as sources (e.g., https://example.com/article) - NO placeholder, example, or descriptive text sources

6. **Competitive Ranking**: 
   - MUST include the input brand AND all provided competitors
   - Score each brand (0-100) with detailed explanations
   - Order brands by overall score (highest score first)
   - Provide ranking justification explaining why each brand ranks where it does
   - Include competitor context and market positioning
   - Include actual clickable URLs as sources (e.g., https://example.com/article) - NO placeholder, example, or descriptive text sources

7. **Editorial Ideas**: 
   - Provide AT LEAST 2 editorial ideas in different formats
   - Include brand tone analysis
   - Provide sample copy that matches the brand's voice
   - No sources needed for editorial ideas

8. **Sources**: Provide actual clickable URLs (e.g., https://example.com/article) that users can visit to verify the information. Do not use placeholder, example, descriptive text, or fake sources. If you cannot provide real URLs, omit the sources field entirely.

Return only valid JSON, no additional text.`;

const BURN_REPORT_PROMPT = `You are a brand analyst with the comedic sensibilities of Bill Murray's deadpan wit and Marc Maron's sharp observational humor. Your job is to provide the SAME comprehensive analysis as above, but with a sophisticated, dry, and entertainingly critical tone.

**IMPORTANT**: Maintain the exact same JSON schema and structure as the professional analysis, but deliver insights with Murray's understated delivery and Maron's incisive commentary style.

Inputs:
- Brand: {brand}
- Competitors: {competitors}
- Region: {region}
- Time window: {since_days} days

**Tone Guidelines** (Bill Murray + Marc Maron style):
- Use dry, understated humor with subtle wit
- Be incisively honest with a touch of world-weary wisdom
- Employ observational comedy that cuts through corporate BS
- Make pointed but not cruel observations about industry realities
- Avoid excessive enthusiasm or obvious punchlines
- Deliver insights with Murray's deadpan delivery and Maron's sharp analysis
- Think "sophisticated cynicism" meets "brand analysis"

**Examples of the refined tone**:
- Instead of "Strong brand recognition" → "Your brand recognition is... well, it exists. People know you. That's something."
- Instead of "Limited social media presence" → "Your social media strategy appears to be 'post occasionally and hope for the best.' It's... a choice."
- Instead of "Competitive advantage" → "You have what we'll generously call a competitive position. It's not nothing."

Requirements (same as professional analysis but with comedic tone):
1. **Brand Profile**: Provide category, industry, target audience, and key differentiators for the brand based on your knowledge.

2. **Executive Summary**: Provide a comprehensive 2-3 paragraph overview of the brand's current market position, key challenges, and opportunities.

3. **Competitive Landscape**: Detailed analysis of the competitive environment, market dynamics, and how the brand fits within the ecosystem.

4. **Sentiment Analysis**: For each channel (web, news, forums, social):
   - Provide specific score (0-100) with detailed explanation
   - Include 3-5 key insights with specific examples
   - Include actual clickable URLs as sources (e.g., https://example.com/article) - NO placeholder, example, or descriptive text sources

5. **SWOT Analysis**: Include competitor context for each point:
   - How strengths compare to competitors
   - How weaknesses compare to competitors
   - Opportunities competitors are missing
   - Threats competitors are facing
   - Include actual clickable URLs as sources (e.g., https://example.com/article) - NO placeholder, example, or descriptive text sources

6. **Competitive Ranking**: 
   - MUST include the input brand AND all provided competitors
   - Score each brand (0-100) with detailed explanations
   - Order brands by overall score (highest score first)
   - Provide ranking justification explaining why each brand ranks where it does
   - Include competitor context and market positioning
   - Include actual clickable URLs as sources (e.g., https://example.com/article) - NO placeholder, example, or descriptive text sources

7. **Editorial Ideas**: 
   - Provide AT LEAST 2 editorial ideas in different formats
   - Include brand tone analysis
   - Provide sample copy that matches the brand's voice
   - No sources needed for editorial ideas

8. **Sources**: Provide actual clickable URLs (e.g., https://example.com/article) that users can visit to verify the information. Do not use placeholder, example, descriptive text, or fake sources. If you cannot provide real URLs, omit the sources field entirely.

**Schema Requirements** (same as professional analysis):
{
  "brand_profile": {
    "category": string,
    "industry": string, 
    "target_audience": string,
    "key_differentiators": string[]
  },
  "executive_summary": string,
  "competitive_landscape": string,
  "sentiment_analysis": {
    "web": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]},
    "news": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]},
    "forums": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]},
    "social": {"score": number, "explanation": string, "key_insights": string[], "sources": string[]}
  },
  "swot_analysis": {
    "strengths": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}],
    "weaknesses": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}],
    "opportunities": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}],
    "threats": [{"summary": string, "rationale": string, "competitor_context": string, "sources": string[]}]
  },
  "competitive_ranking": [
    {
      "brand": string,
      "overall_score": number,
      "score_breakdown": {
        "sentiment": {"score": number, "explanation": string},
        "share_of_voice": {"score": number, "explanation": string},
        "ai_readiness": {"score": number, "explanation": string},
        "seo_health": {"score": number, "explanation": string},
        "social_resonance": {"score": number, "explanation": string}
      },
      "ranking_justification": string,
      "sources": string[]
    }
  ],
  "editorial_ideas": [
    {
      "format": "faq" | "blog" | "short_social",
      "title": string,
      "angle": string,
      "brand_tone": string,
      "outline": string[],
      "sample_copy": string
    }
  ]
}

Return only valid JSON, no additional text.`;

export async function POST(request: NextRequest) {
  try {
    const body: BrandAnalysisRequest = await request.json();
    const { brand, competitors = [], region = 'global', sinceDays = 30, roastMode = false } = body;

    if (!brand) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Select prompt based on roast mode
    const basePrompt = roastMode ? BURN_REPORT_PROMPT : ANALYSIS_PROMPT;
    
    // Prepare the prompt with actual values
    const prompt = basePrompt
      .replace('{brand}', brand)
      .replace('{competitors}', competitors.join(', '))
      .replace('{region}', region)
      .replace('{since_days}', sinceDays.toString());

    // Call OpenAI with web search enabled using the responses API
    const response = await openai.responses.create({
      model: 'gpt-4o',
      input: prompt + '\n\nIMPORTANT: Use web search to gather real-time information about the brand and competitors. Provide analysis based on current web data, news, and social media. For all sources, provide actual clickable URLs (e.g., https://example.com/article) that users can visit to verify the information. Return only valid JSON.',
      tools: [
        {
          type: 'web_search',
        },
      ],
      temperature: parseFloat(process.env.DEFAULT_TEMPERATURE || '0.3'),
    });

    // Extract the JSON response from responses API
    const content = response.output_text;
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
    } catch {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Schema metadata is extracted for internal analysis but not included in user-facing report
    // This helps inform the LLM's analysis but doesn't need to be displayed to users

    return NextResponse.json({
      ...analysisData,
      roastMode,
      inputBrand: brand
    });
  } catch (error) {
    console.error('Brand analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze brand' },
      { status: 500 }
    );
  }
}

