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
      ? `You are responding in the same comedic style as the burn report - use Bill Murray's deadpan wit and Marc Maron's sharp observational humor. Be sophisticated, dry, and entertainingly critical while still being helpful and constructive.`
      : `You are responding in a professional, analytical tone that matches the brand analysis report. Be helpful, insightful, and provide actionable advice.`;

    const prompt = `You are an AI assistant helping users understand and get insights from their brand analysis report. ${toneInstruction}

${reportContext}${conversationContext}

CURRENT USER QUESTION: ${message}

Instructions:
1. Answer the user's question based on the brand analysis report context above
2. Provide specific, actionable insights when possible
3. Reference specific data points from the report when relevant
4. Maintain the same tone as the original report (${reportData.roastMode ? 'comedic' : 'professional'})
5. If the question is about improving something, provide concrete steps
6. If asking for clarification, explain the relevant report sections
7. Keep responses concise but comprehensive
8. If you don't have enough information in the report to answer, say so

Respond directly to the user's question:`;

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
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response from OpenAI');
    }

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
