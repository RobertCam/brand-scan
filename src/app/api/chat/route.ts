import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced web search function for real-time market intelligence
async function performWebSearch(query: string, focus?: string): Promise<string> {
  try {
    console.log(`Performing web search: "${query}" with focus: "${focus || 'general'}"`);
    
    // Enhance the search query with context
    const enhancedQuery = focus 
      ? `${query} ${focus} recent news trends 2024`
      : `${query} recent news trends market analysis 2024`;

    // Use OpenAI's responses API with web_search tool
    const response = await openai.responses.create({
      input: enhancedQuery,
      tools: [{ type: 'web_search' }],
    });

    // Extract search results from the response
    const searchResults = response.output_text || 'No search results found';
    console.log(`Web search completed. Results length: ${searchResults.length}`);
    
    return searchResults;
  } catch (error) {
    console.error('Web search error:', error);
    return `Search failed for query: "${query}". Please try again or provide more specific information.`;
  }
}

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

interface ChartConfig {
  type: string; // Made flexible to support any chart type
  title: string;
  description: string;
  data: unknown;
  insights: string[];
  chartData?: {
    // Flexible data structure for any chart type
    labels?: string[];
    datasets?: Array<{
      label: string;
      data: number[] | Array<{x: number, y: number}>;
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      [key: string]: unknown;
    }>;
    // For matrices and other custom charts
    matrix?: Array<Array<{value: number, label: string}>>;
    categories?: string[];
    values?: number[];
    // For scatter plots
    points?: Array<{x: number, y: number, label: string}>;
  };
}

// Enhanced chart generation function that can create any type of chart
async function generateChartConfig(message: string, reportData: BrandAnalysisWithMetadata): Promise<ChartConfig | null> {
  try {
    // Intelligently determine if web search is needed by asking the AI
    const searchDecisionPrompt = `You are an AI assistant that determines whether additional web search is needed to answer a user's question.

User's request: "${message}"

Available data from the brand analysis report:
- Brand: ${reportData.inputBrand}
- Competitors: ${reportData.competitive_ranking.map(c => c.brand).join(', ')}
- Sentiment Scores: Web: ${reportData.sentiment_analysis.web.score}, News: ${reportData.sentiment_analysis.news.score}, Forums: ${reportData.sentiment_analysis.forums.score}, Social: ${reportData.sentiment_analysis.social.score}
- Editorial Ideas: ${reportData.editorial_ideas?.map(idea => `${idea.title}: ${idea.angle}`).join('; ') || 'None'}

Question: Can the user's request be fully answered using ONLY the data listed above? 

Respond with ONLY "YES" if the existing data is sufficient, or "NO" if additional web search is needed to provide a complete answer.`;

    const searchDecision = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: searchDecisionPrompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const needsWebSearch = searchDecision.choices[0]?.message?.content?.trim().toUpperCase() === 'NO';

    let additionalData = '';
    if (needsWebSearch) {
      try {
        // Extract key terms for web search from the user's request
        const searchTerms = message.toLowerCase()
          .replace(/chart|graph|show|me|create|generate|display|plot|bar|line|pie|scatter|matrix/i, '')
          .replace(/vs|compared|comparison|against|versus/i, '')
          .trim();
        
        const searchResults = await performWebSearch(searchTerms, 'specific data for chart generation');
        additionalData = `\n\nAdditional web search data: ${JSON.stringify(searchResults).substring(0, 1000)}...`;
      } catch (searchError) {
        console.error('Web search in chart generation failed:', searchError);
        additionalData = '\n\nNote: Could not fetch additional data via web search.';
      }
    }

    const chartPrompt = `Generate a chart immediately. Do NOT provide instructions or explanations.

User request: "${message}"

CRITICAL: Respond with ONLY valid JSON. No explanations, no markdown, no additional text. Just the JSON object.

You can use data from multiple sources:
1. Brand analysis data (if relevant to the request)
2. Web search data (if the request needs current/external data)
3. Create realistic data based on the user's specific request

Brand analysis data available:
- Brand: ${reportData.inputBrand}
- Competitors: ${reportData.competitive_ranking.map(c => c.brand).join(', ')}
- Sentiment Scores: Web: ${reportData.sentiment_analysis.web.score}, News: ${reportData.sentiment_analysis.news.score}, Forums: ${reportData.sentiment_analysis.forums.score}, Social: ${reportData.sentiment_analysis.social.score}
- Editorial Ideas: ${reportData.editorial_ideas?.map(idea => `${idea.title}: ${idea.angle}`).join('; ') || 'None'}${additionalData}

IMPORTANT: If the user requests data not available in the brand analysis (like "Reddit sentiment over time"), create realistic data that makes sense for their request. Use your knowledge to generate appropriate data points.

Chart types you can create: matrix, scatter_plot, bar_chart, line_chart, pie_chart, area_chart, heatmap, bubble_chart, etc.

For matrices (like effort vs value), use this structure:
{
  "type": "matrix",
  "title": "Chart Title",
  "description": "Chart description",
  "data": {},
  "insights": ["insight1", "insight2"],
  "chartData": {
    "matrix": [
      [{"value": 8, "label": "High Value, Low Effort"}, {"value": 6, "label": "Medium Value, Low Effort"}],
      [{"value": 4, "label": "High Value, High Effort"}, {"value": 2, "label": "Low Value, High Effort"}]
    ],
    "categories": ["Low Effort", "High Effort"],
    "values": ["High Value", "Low Value"]
  }
}

For scatter plots:
{
  "type": "scatter_plot",
  "title": "Chart Title",
  "description": "Chart description",
  "data": {},
  "insights": ["insight1", "insight2"],
  "chartData": {
    "points": [
      {"x": 5, "y": 8, "label": "Brand A"},
      {"x": 7, "y": 6, "label": "Brand B"}
    ]
  }
}

For bar charts:
{
  "type": "bar_chart",
  "title": "Chart Title",
  "description": "Chart description",
  "data": {},
  "insights": ["insight1", "insight2"],
  "chartData": {
    "labels": ["Category 1", "Category 2"],
    "datasets": [{"label": "Values", "data": [10, 20]}]
  }
}

IMPORTANT: If additional web search data is provided above, use that data to create more specific and accurate charts. For example, if the user asks for "Xbox vs PlayStation exclusive games", use the web search data to identify actual games and create realistic sentiment scores based on the search results.

EXAMPLE: If user asks for "Xbox vs PlayStation sentiment chart", create:
{
  "type": "bar_chart",
  "title": "Xbox vs PlayStation Sentiment Comparison",
  "description": "Sentiment analysis comparison across platforms",
  "data": {},
  "insights": ["Xbox leads in web sentiment", "PlayStation stronger in social media"],
  "chartData": {
    "labels": ["Web", "News", "Forums", "Social"],
    "datasets": [
      {"label": "Xbox", "data": [${reportData.sentiment_analysis.web.score}, ${reportData.sentiment_analysis.news.score}, ${reportData.sentiment_analysis.forums.score}, ${reportData.sentiment_analysis.social.score}]},
      {"label": "PlayStation", "data": [75, 68, 72, 80]}
    ]
  }
}

CRITICAL CHART DATA REQUIREMENTS:
- Use ONLY the actual sentiment scores from the brand analysis: Web: ${reportData.sentiment_analysis.web.score}, News: ${reportData.sentiment_analysis.news.score}, Forums: ${reportData.sentiment_analysis.forums.score}, Social: ${reportData.sentiment_analysis.social.score}
- For competitors, create realistic scores that make sense (typically 60-85 range)
- Ensure all data points are meaningful and reflect actual brand performance
- Do NOT create random or nonsensical data

Respond with ONLY the JSON object:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: chartPrompt }],
      temperature: 0.1,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    console.log('Chart generation response:', content);

    // Try multiple methods to extract valid JSON
    let jsonContent = content.trim();

    // Method 1: Extract from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    // Method 2: Extract from any code blocks
    const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
    if (codeMatch && !jsonMatch) {
      jsonContent = codeMatch[1].trim();
    }

    // Method 3: Look for JSON object boundaries
    const jsonStart = jsonContent.indexOf('{');
    const jsonEnd = jsonContent.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      jsonContent = jsonContent.substring(jsonStart, jsonEnd + 1);
    }

    // Method 4: Try to find the end of the JSON by looking for the last complete object
    let braceCount = 0;
    let endIndex = -1;
    for (let i = 0; i < jsonContent.length; i++) {
      if (jsonContent[i] === '{') braceCount++;
      if (jsonContent[i] === '}') braceCount--;
      if (braceCount === 0 && i > 0) {
        endIndex = i;
        break;
      }
    }

    if (endIndex !== -1) {
      jsonContent = jsonContent.substring(0, endIndex + 1);
    }

    console.log('Extracted JSON content:', jsonContent);

    try {
      return JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Raw content:', content);
      console.error('Extracted content:', jsonContent);
      return null;
    }
  } catch (error) {
    console.error('Chart generation error:', error);
    return null;
  }
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

    // Build detailed context from report data
    const sortedRanking = [...(reportData.competitive_ranking || [])].sort((a, b) => b.overall_score - a.overall_score);
    const topCompetitor = sortedRanking[0];
    const brandRanking = sortedRanking.find(r => r.brand === reportData.inputBrand);
    const brandPosition = sortedRanking.findIndex(r => r.brand === reportData.inputBrand) + 1;
    
    const reportContext = `
## BRAND PROFILE & POSITIONING
**Brand**: ${reportData.inputBrand || 'Unknown'}
**Industry**: ${reportData.brand_profile.industry}
**Category**: ${reportData.brand_profile.category}
**Target Audience**: ${reportData.brand_profile.target_audience}
**Key Differentiators**: ${reportData.brand_profile.key_differentiators.join(', ')}

## COMPETITIVE POSITION
**Current Ranking**: #${brandPosition} of ${sortedRanking.length} competitors
**Overall Score**: ${brandRanking?.overall_score || 'N/A'}/100
**Top Competitor**: ${topCompetitor?.brand} (${topCompetitor?.overall_score}/100)
**Competitive Gap**: ${topCompetitor?.overall_score - (brandRanking?.overall_score || 0)} points behind leader

## SENTIMENT PERFORMANCE
**Web Sentiment**: ${reportData.sentiment_analysis.web.score}/100 - ${reportData.sentiment_analysis.web.explanation}
**News Sentiment**: ${reportData.sentiment_analysis.news.score}/100 - ${reportData.sentiment_analysis.news.explanation}
**Forums Sentiment**: ${reportData.sentiment_analysis.forums.score}/100 - ${reportData.sentiment_analysis.forums.explanation}
**Social Sentiment**: ${reportData.sentiment_analysis.social.score}/100 - ${reportData.sentiment_analysis.social.explanation}

**Strongest Channel**: ${Object.entries(reportData.sentiment_analysis).reduce((a, b) => a[1].score > b[1].score ? a : b)[0]} (${Object.entries(reportData.sentiment_analysis).reduce((a, b) => a[1].score > b[1].score ? a : b)[1].score}/100)
**Weakest Channel**: ${Object.entries(reportData.sentiment_analysis).reduce((a, b) => a[1].score < b[1].score ? a : b)[0]} (${Object.entries(reportData.sentiment_analysis).reduce((a, b) => a[1].score < b[1].score ? a : b)[1].score}/100)

## STRATEGIC ASSESSMENT
**Executive Summary**: ${reportData.executive_summary}

**Competitive Landscape**: ${reportData.competitive_landscape}

## SWOT ANALYSIS
**Strengths** (${reportData.swot_analysis?.strengths?.length || 0} identified):
${reportData.swot_analysis?.strengths?.map(s => `• ${s.summary}: ${s.rationale}`).join('\n') || 'No strengths data'}

**Weaknesses** (${reportData.swot_analysis?.weaknesses?.length || 0} identified):
${reportData.swot_analysis?.weaknesses?.map(w => `• ${w.summary}: ${w.rationale}`).join('\n') || 'No weaknesses data'}

**Opportunities** (${reportData.swot_analysis?.opportunities?.length || 0} identified):
${reportData.swot_analysis?.opportunities?.map(o => `• ${o.summary}: ${o.rationale}`).join('\n') || 'No opportunities data'}

**Threats** (${reportData.swot_analysis?.threats?.length || 0} identified):
${reportData.swot_analysis?.threats?.map(t => `• ${t.summary}: ${t.rationale}`).join('\n') || 'No threats data'}

## COMPETITIVE RANKING DETAILS
${sortedRanking.map((ranking, index) => 
  `${index + 1}. **${ranking.brand}**: ${ranking.overall_score}/100
   - Justification: ${ranking.ranking_justification}
   - Score Breakdown: Sentiment ${ranking.score_breakdown.sentiment.score}, Share of Voice ${ranking.score_breakdown.share_of_voice.score}, AI Readiness ${ranking.score_breakdown.ai_readiness.score}, SEO Health ${ranking.score_breakdown.seo_health.score}, Social Resonance ${ranking.score_breakdown.social_resonance.score}`
).join('\n\n')}

## CONTENT OPPORTUNITIES
**Editorial Ideas** (${reportData.editorial_ideas?.length || 0} identified):
${reportData.editorial_ideas?.map(idea => 
  `• **${idea.title}**: ${idea.angle} (Format: ${idea.format})`
).join('\n') || 'No editorial ideas available'}
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

    // Intelligently determine if web search is needed for the main response
    const searchDecisionPrompt = `You are an AI assistant that determines whether additional web search is needed to answer a user's question.

User's question: "${message}"

Available data from the brand analysis report:
- Brand: ${reportData.inputBrand}
- Competitors: ${reportData.competitive_ranking.map(c => c.brand).join(', ')}
- Sentiment Scores: Web: ${reportData.sentiment_analysis.web.score}, News: ${reportData.sentiment_analysis.news.score}, Forums: ${reportData.sentiment_analysis.forums.score}, Social: ${reportData.sentiment_analysis.social.score}
- Editorial Ideas: ${reportData.editorial_ideas?.map(idea => `${idea.title}: ${idea.angle}`).join('; ') || 'None'}
- SWOT Analysis: ${reportData.swot_analysis?.strengths?.length || 0} strengths, ${reportData.swot_analysis?.weaknesses?.length || 0} weaknesses, ${reportData.swot_analysis?.opportunities?.length || 0} opportunities, ${reportData.swot_analysis?.threats?.length || 0} threats

Question: Can the user's question be fully answered using ONLY the data listed above? 

Respond with ONLY "YES" if the existing data is sufficient, or "NO" if additional web search is needed to provide a complete answer.`;

    const searchDecision = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: searchDecisionPrompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const searchDecisionResult = searchDecision.choices[0]?.message?.content?.trim().toUpperCase();
    console.log('Web search decision result:', searchDecisionResult);
    const needsWebSearch = searchDecisionResult === 'NO';

    // Perform web search if needed
    let webSearchResults = '';
    if (needsWebSearch) {
      try {
        const searchTerms = message.toLowerCase()
          .replace(/chart|graph|show|me|create|generate|display|plot|bar|line|pie|scatter|matrix/i, '')
          .replace(/vs|compared|comparison|against|versus/i, '')
          .trim();
        
        const searchResults = await performWebSearch(searchTerms, 'specific data for comprehensive answer');
        webSearchResults = `\n\n## CURRENT WEB SEARCH DATA\nBased on recent web search for "${searchTerms}":\n${JSON.stringify(searchResults).substring(0, 2000)}...`;
      } catch (searchError) {
        console.error('Web search failed:', searchError);
        webSearchResults = '\n\n## WEB SEARCH NOTE\nNote: Could not fetch additional current data via web search.';
      }
    }

    // AI-based chart detection - determine if user wants a visualization
    const chartDetectionPrompt = `You are an AI assistant that determines whether a user wants a data visualization/chart.

User's request: "${message}"

Available data from brand analysis:
- Brand: ${reportData.inputBrand}
- Sentiment scores: Web: ${reportData.sentiment_analysis.web.score}, News: ${reportData.sentiment_analysis.news.score}, Forums: ${reportData.sentiment_analysis.forums.score}, Social: ${reportData.sentiment_analysis.social.score}
- Competitors: ${reportData.competitive_ranking.map(c => c.brand).join(', ')}

Question: Does the user want a data visualization, chart, graph, or plot? Look for:
- Explicit requests for charts/graphs/visualizations
- Requests to "show" or "display" data visually
- Requests for plots, matrices, or specific chart types
- Requests to "visualize" or "plot" data

Respond with ONLY "YES" if they want a visualization, or "NO" if they want text analysis.`;

    const chartDetection = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: chartDetectionPrompt }],
      temperature: 0.1,
      max_tokens: 10,
    });

    const chartDetectionResult = chartDetection.choices[0]?.message?.content?.trim().toUpperCase();
    const isChartRequest = chartDetectionResult === 'YES';
    let chartConfig: ChartConfig | null = null;
    
    console.log('AI Chart detection:', { 
      message, 
      isChartRequest, 
      detectionResult: chartDetectionResult,
      chartConfig: chartConfig ? 'Generated' : 'Not generated'
    });
    
    if (isChartRequest) {
      // Generate chart configuration
      chartConfig = await generateChartConfig(message, reportData);
      
      // If chart generation failed, create a simple fallback
      if (!chartConfig) {
        console.log('Chart generation failed, creating fallback');
        chartConfig = {
          type: 'bar_chart',
          title: 'Chart Generation Failed',
          description: 'Unable to generate the requested chart. Please try rephrasing your request.',
          data: reportData,
          insights: ['Chart generation encountered an error', 'Please try a different request format'],
          chartData: {
            labels: ['Error'],
            datasets: [{ label: 'Status', data: [0] }]
          }
        };
      }
    }

    const prompt = `You are a senior brand strategy consultant with 15+ years of experience working with Fortune 500 companies. You're conducting a strategic session with the ${reportData.inputBrand || 'brand'} team to help them understand their competitive position and identify growth opportunities.

${toneInstruction}

## BRAND CONTEXT & CURRENT SITUATION
${reportContext}

## CONVERSATION HISTORY
${conversationContext}

## CURRENT STRATEGIC QUESTION
The ${reportData.inputBrand || 'brand'} team is asking: "${message}"${webSearchResults}

## YOUR EXPERTISE & CAPABILITIES
- Deep industry knowledge across multiple sectors
- **REAL-TIME MARKET INTELLIGENCE**: Access to current market trends, competitor news, industry reports, and consumer sentiment via web search
- Advanced data visualization and chart generation capabilities
- Experience with brand positioning, competitive analysis, and growth strategy
- **PROACTIVE RESEARCH**: Always search for current information when discussing market trends, competitor moves, or industry developments

## RESPONSE REQUIREMENTS
1. **Be Concise**: Get straight to the point. No lengthy introductions or explanations.
2. **Be Strategic**: Think like a senior consultant. Provide insights that a CMO or CEO would find valuable.
3. **Be Specific**: Reference exact data points, scores, and metrics from their analysis.
4. **Be Actionable**: Include concrete next steps they can take within 30-90 days.
5. **Use Data**: Cite specific scores, rankings, and competitive gaps from the analysis.

9. **USE WEB SEARCH PROACTIVELY**: Search for current information when discussing:
   - Market trends and industry developments
   - Competitor news and strategic moves
   - Consumer sentiment and behavior changes
   - Regulatory changes affecting their industry
   - Emerging technologies or platforms
   - Recent industry reports or studies

## WEB SEARCH GUIDELINES:
- **Always search** when the question involves market trends, competitor analysis, or industry developments
- **Search for specific competitors** mentioned in their analysis: ${reportData.competitive_ranking?.map(c => c.brand).join(', ')}
- **Search for industry trends** in ${reportData.brand_profile.industry}
- **Search for recent news** about ${reportData.inputBrand} and their competitors
- **Use search results** to provide current, relevant insights that enhance your analysis

## EXAMPLES OF HIGH-QUALITY RESPONSES WITH WEB SEARCH:
- "Your sentiment score of ${reportData.sentiment_analysis.web.score} on web platforms puts you ${reportData.sentiment_analysis.web.score > 70 ? 'above' : 'below'} industry average. Based on current market trends I found, here's what this means for your SEO strategy..."
- "Looking at your competitive ranking, you're ${reportData.competitive_ranking[0]?.overall_score > 80 ? 'leading' : 'trailing'} ${reportData.competitive_ranking[0]?.brand} by ${Math.abs(reportData.competitive_ranking[0]?.overall_score - reportData.competitive_ranking[1]?.overall_score)} points. Recent industry reports show the gap is primarily in..."
- "Your SWOT analysis reveals ${reportData.swot_analysis?.strengths?.length || 0} key strengths but ${reportData.swot_analysis?.weaknesses?.length || 0} critical weaknesses. Current market intelligence suggests..."

## QUESTIONS THAT REQUIRE WEB SEARCH:
- "What are the latest trends in ${reportData.brand_profile.industry}?"
- "How are our competitors performing recently?"
- "What's happening in the market that could affect us?"
- "Are there any new regulations or changes affecting our industry?"
- "What do consumers think about brands like ours?"
- "What are the emerging opportunities in our space?"

## TONE GUIDELINES
${reportData.roastMode ? 'In burn mode: Deliver sophisticated, dry wit that cuts through corporate BS while still being constructive. Think Bill Murray meets Marc Maron - entertainingly critical but ultimately helpful.' : 'Professional, analytical, and strategic. Be the consultant they wish they had on retainer.'}

Now provide a strategic response to their question. Be direct and concise - no lengthy introductions or explanations.`;

    // Separate chart and text responses completely
    let response;
    if (isChartRequest) {
      // For chart requests, create a minimal response that won't generate text
      response = {
        [Symbol.asyncIterator]: async function* () {
          // Yield empty chunks to satisfy the streaming interface
          yield { choices: [{ delta: { content: '' }, finish_reason: 'stop' }] };
        }
      };
    } else {
      // Only call the main chat API for non-chart requests
      response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          ...conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: reportData.roastMode ? 0.8 : 0.5,
        max_tokens: 2000,
        stream: true,
        tools: [],
      });
    }

    // Create a streaming response with function calling support
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let functionCallData: {
          type: string;
          title: string;
          description: string;
          data: BrandAnalysisWithMetadata;
          insights: string[];
          data_focus?: string;
          chartData?: {
            labels?: string[];
            datasets?: Array<{
              label: string;
              data: number[] | Array<{x: number, y: number}>;
              backgroundColor?: string | string[];
              borderColor?: string | string[];
              [key: string]: unknown;
            }>;
            matrix?: Array<Array<{value: number, label: string}>>;
            categories?: string[];
            values?: string[];
            points?: Array<{x: number, y: number, label: string}>;
          };
        } | null = null;

        try {
          for await (const chunk of response) {
            const delta = chunk.choices[0]?.delta;
            console.log('Received chunk:', JSON.stringify(chunk));
            console.log('Delta:', JSON.stringify(delta));
            
            // Handle content streaming
            if (delta?.content) {
              console.log('Streaming content:', delta.content);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta.content })}\n\n`));
            }

          }

          // Send chart data if generated via function call
          if (functionCallData) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chart: functionCallData })}\n\n`));
          } else if (chartConfig) {
            // Fallback to original chart config
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chart: chartConfig })}\n\n`));
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch {
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
