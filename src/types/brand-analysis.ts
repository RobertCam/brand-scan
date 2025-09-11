export interface BrandAnalysisRequest {
  brand: string;
  competitors?: string[];
  region?: string;
  sinceDays?: number;
}

export interface SentimentByChannel {
  web: number;
  news: number;
  forums: number;
  social: number;
}

export interface SWOTItem {
  summary: string;
  rationale: string;
  citations: string[];
}

export interface SWOTAnalysis {
  s: SWOTItem[];
  w: SWOTItem[];
  o: SWOTItem[];
  t: SWOTItem[];
}

export interface CompetitiveScore {
  sentiment: number;
  sov: number; // Share of Voice
  ai_readiness: number;
  seo_health: number;
  social_resonance: number;
}

export interface CompetitiveRanking {
  brand: string;
  scores: CompetitiveScore;
  overall: number;
  citations: string[];
}

export interface Recommendation {
  title: string;
  rationale: string;
  channel: 'ai' | 'seo' | 'social';
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
  citations: string[];
}

export interface EditorialIdea {
  format: 'faq' | 'blog' | 'short_social';
  title: string;
  angle: string;
  outline: string[];
  citations: string[];
}

export interface BrandAnalysisResponse {
  known: string[];
  sentiment_by_channel: SentimentByChannel;
  swot: SWOTAnalysis;
  competitive_ranking: CompetitiveRanking[];
  recommendations: Recommendation[];
  editorial_ideas: EditorialIdea[];
}

export interface SchemaMetadata {
  title?: string;
  description?: string;
  organization?: any;
  product?: any;
  faqPage?: any;
  review?: any;
  url: string;
}

export interface BrandAnalysisWithMetadata extends BrandAnalysisResponse {
  metadata: SchemaMetadata[];
}

