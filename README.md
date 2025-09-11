# Brand Insights MVP

A comprehensive brand analysis tool that leverages OpenAI's Responses API with web search to analyze brand visibility, competitive positioning, and provide actionable insights.

## Features

- **Web Search Analysis**: Comprehensive analysis across web, news, forums, and social platforms
- **Competitive Ranking**: Score brands on sentiment, share of voice, AI-readiness, SEO health, and social resonance
- **SWOT Analysis**: Detailed strengths, weaknesses, opportunities, and threats analysis
- **Schema.org Analysis**: Extract and analyze structured data for AI-search readiness
- **Actionable Recommendations**: Prioritized opportunities with RICE scoring
- **Editorial Ideas**: Content suggestions in multiple formats (FAQ, blog, social)
- **Export Functionality**: Export reports to PDF and Markdown
- **Professional UI**: Export-friendly design with sticky navigation

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **LLM**: OpenAI GPT-4o with web search
- **Schema Extraction**: Cheerio for HTML parsing
- **Export**: jsPDF for PDF generation

## Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd brand-scan
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   MAX_SEARCH_RESULTS=15
   DEFAULT_TEMPERATURE=0.3
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Enter Brand Information**:
   - Enter the primary brand name
   - Optionally add competitors
   - Select region and time window

2. **Analyze**:
   - Click "Analyze Brand" to start the analysis
   - The system will use OpenAI's web search to gather comprehensive data

3. **Review Results**:
   - Navigate through different sections using the sidebar
   - View competitive rankings, SWOT analysis, and recommendations
   - Check schema.org analysis for technical insights

4. **Export Reports**:
   - Export to PDF for client presentations
   - Export to Markdown for developer workflows

## API Endpoints

### POST `/api/analyze`

Analyzes a brand using OpenAI's web search capabilities.

**Request Body**:
```json
{
  "brand": "string (required)",
  "competitors": ["string[] (optional)"],
  "region": "string (optional, default: 'global')",
  "sinceDays": "number (optional, default: 30)"
}
```

**Response**:
```json
{
  "known": ["string"],
  "sentiment_by_channel": {
    "web": "number",
    "news": "number", 
    "forums": "number",
    "social": "number"
  },
  "swot": {
    "s": [{"summary": "string", "rationale": "string", "citations": ["string"]}],
    "w": [{"summary": "string", "rationale": "string", "citations": ["string"]}],
    "o": [{"summary": "string", "rationale": "string", "citations": ["string"]}],
    "t": [{"summary": "string", "rationale": "string", "citations": ["string"]}]
  },
  "competitive_ranking": [{
    "brand": "string",
    "scores": {
      "sentiment": "number",
      "sov": "number",
      "ai_readiness": "number", 
      "seo_health": "number",
      "social_resonance": "number"
    },
    "overall": "number",
    "citations": ["string"]
  }],
  "recommendations": [{
    "title": "string",
    "rationale": "string",
    "channel": "ai|seo|social",
    "reach": "number",
    "impact": "number",
    "confidence": "number", 
    "effort": "number",
    "citations": ["string"]
  }],
  "editorial_ideas": [{
    "format": "faq|blog|short_social",
    "title": "string",
    "angle": "string",
    "outline": ["string"],
    "citations": ["string"]
  }],
  "metadata": [{
    "url": "string",
    "title": "string",
    "description": "string",
    "organization": "object",
    "product": "object", 
    "faqPage": "object",
    "review": "object"
  }]
}
```

## Competitive Scoring Rubric

The system scores brands on five weighted criteria:

| Criterion | Weight | Description |
|-----------|--------|-------------|
| **Sentiment** | 25% | Aggregate sentiment across web, news, forums, and social |
| **Share of Voice** | 20% | Relative visibility vs competitors based on mentions |
| **AI-Search Readiness** | 20% | Schema.org markup and structured data completeness |
| **SEO Health** | 20% | On-page readiness and keyword alignment |
| **Social Resonance** | 15% | Engagement signals across social platforms |

## Cost Controls

- Limited search depth (~10-15 URLs max)
- JSON snippets only (titles, descriptions, links)
- Temperature ≤ 0.3 for deterministic outputs
- Configurable rate limiting via environment variables

## Development

### Project Structure

```
src/
├── app/
│   ├── api/analyze/route.ts    # Main analysis API endpoint
│   ├── layout.tsx              # App layout
│   └── page.tsx                # Main page component
├── components/
│   ├── BrandAnalysisForm.tsx   # Input form component
│   └── BrandReport.tsx         # Report display component
├── lib/
│   ├── schema-extractor.ts     # Schema.org extraction utility
│   └── utils.ts                # Utility functions
└── types/
    └── brand-analysis.ts       # TypeScript type definitions
```

### Key Features Implemented

- ✅ OpenAI Responses API integration with web search
- ✅ Schema.org and metadata extraction
- ✅ Competitive scoring with weighted criteria
- ✅ Professional report layout with sticky navigation
- ✅ PDF and Markdown export functionality
- ✅ Responsive design with Tailwind CSS
- ✅ TypeScript for type safety
- ✅ Error handling and loading states

## License

MIT License - see LICENSE file for details.