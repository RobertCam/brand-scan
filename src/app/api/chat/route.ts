import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  message: string;
  reportData: BrandAnalysisWithMetadata;
  conversationHistory: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, reportData, conversationHistory } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Build context from report data
    const reportContext = `
BRAND ANALYSIS REPORT CONTEXT:
- Brand: ${reportData.inputBrand || 'Unknown'}
- Analysis Type: ${reportData.roastMode ? 'Burn Report (Comedic)' : 'Professional Analysis'}
- Report Mode: ${reportData.roastMode ? 'Bill Murray + Marc Maron comedic style' : 'Professional analytical tone'}

BRAND PROFILE:
- Category: ${reportData.brand_profile.category}
- Industry: ${reportData.brand_profile.industry}
- Target Audience: ${reportData.brand_profile.target_audience}
- Key Differentiators: ${reportData.brand_profile.key_differentiators.join(', ')}

EXECUTIVE SUMMARY:
${reportData.executive_summary}

COMPETITIVE LANDSCAPE:
${reportData.competitive_landscape}

SENTIMENT ANALYSIS:
Web: ${reportData.sentiment_analysis.web.score}/100 - ${reportData.sentiment_analysis.web.explanation}
News: ${reportData.sentiment_analysis.news.score}/100 - ${reportData.sentiment_analysis.news.explanation}
Forums: ${reportData.sentiment_analysis.forums.score}/100 - ${reportData.sentiment_analysis.forums.explanation}
Social: ${reportData.sentiment_analysis.social.score}/100 - ${reportData.sentiment_analysis.social.explanation}

SWOT ANALYSIS:
Strengths: ${reportData.swot_analysis.strengths.map(s => s.summary).join('; ')}
Weaknesses: ${reportData.swot_analysis.weaknesses.map(w => w.summary).join('; ')}
Opportunities: ${reportData.swot_analysis.opportunities.map(o => o.summary).join('; ')}
Threats: ${reportData.swot_analysis.threats.map(t => t.summary).join('; ')}

COMPETITIVE RANKING:
${reportData.competitive_ranking.map((ranking, index) => 
  `${index + 1}. ${ranking.brand}: ${ranking.overall_score}/100 - ${ranking.ranking_justification}`
).join('\n')}

EDITORIAL IDEAS:
${reportData.editorial_ideas.map(idea => 
  `${idea.title}: ${idea.angle}`
).join('\n')}
`;

    // Build conversation history
    const conversationContext = conversationHistory.length > 0 
      ? `\n\nCONVERSATION HISTORY:\n${conversationHistory.map(msg => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n')}`
      : '';

    // Determine tone based on report mode
    const toneInstruction = reportData.roastMode 
      ? `You are responding in the same comedic style as the burn report - channel Bill Murray's deadpan wit and Marc Maron's sharp observational humor. Be sophisticated, dry, and entertainingly critical while still being helpful and constructive. Use Murray's understated delivery and Maron's incisive commentary style. Think "sophisticated cynicism" meets "brand analysis" - deliver insights with world-weary wisdom and subtle wit.`
      : `You are responding in a professional, analytical tone that matches the brand analysis report. Be helpful, insightful, and provide actionable advice.`;

    const prompt = `You are an AI assistant helping the ${reportData.inputBrand || 'brand'} team understand and get insights from their brand analysis report. The user asking questions is part of the ${reportData.inputBrand || 'brand'} team, so respond as if you're consulting directly with the brand's stakeholders.

${toneInstruction}

${reportContext}${conversationContext}

CURRENT QUESTION FROM ${reportData.inputBrand || 'BRAND'} TEAM: ${message}

Instructions:
1. Answer as if consulting directly with the ${reportData.inputBrand || 'brand'} team
2. Provide specific, actionable insights tailored to their brand
3. Reference specific data points from their report when relevant
4. Maintain the same tone as the original report (${reportData.roastMode ? 'comedic' : 'professional'})
5. If the question is about improving something, provide concrete steps they can take
6. If asking for clarification, explain the relevant report sections in context of their brand
7. Keep responses concise but comprehensive
8. Use "your brand", "your company", "your team" when referring to ${reportData.inputBrand || 'the brand'}
9. If you don't have enough information in the report to answer, say so
${reportData.roastMode ? '10. In burn mode: Be entertainingly critical but constructive - deliver tough love with sophisticated humor. Use dry wit and observational comedy that cuts through corporate BS while still being helpful.' : ''}

Respond directly to the ${reportData.inputBrand || 'brand'} team's question:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: prompt,
        },
      ],
      temperature: reportData.roastMode ? 0.7 : 0.3,
      max_tokens: 1000,
      stream: true,
    });

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Streaming error' })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
