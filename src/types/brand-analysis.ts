export interface BrandAnalysisRequest {
  brand: string;
  competitors?: string[];
  region?: string;
  sinceDays?: number;
  roastMode?: boolean;
}

export interface SentimentChannel {
  score: number;
  explanation: string;
  key_insights: string[];
  sources: string[];
}

export interface SentimentAnalysis {
  web: SentimentChannel;
  news: SentimentChannel;
  forums: SentimentChannel;
  social: SentimentChannel;
}

export interface SWOTItem {
  summary: string;
  rationale: string;
  competitor_context: string;
  sources: string[];
}

export interface SWOTAnalysis {
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
}

export interface ScoreBreakdown {
  sentiment: { score: number; explanation: string };
  share_of_voice: { score: number; explanation: string };
  ai_readiness: { score: number; explanation: string };
  seo_health: { score: number; explanation: string };
  social_resonance: { score: number; explanation: string };
}

export interface CompetitiveRanking {
  brand: string;
  overall_score: number;
  score_breakdown: ScoreBreakdown;
  ranking_justification: string;
  sources: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  channel: 'ai' | 'seo' | 'social';
  impact_score: number;
  effort_score: number;
  time_estimate: string;
  complexity_level: 'low' | 'medium' | 'high';
  step_by_step_guide: string[];
  expected_outcomes: string;
  sources: string[];
}

export interface EditorialIdea {
  format: 'faq' | 'blog' | 'short_social';
  title: string;
  angle: string;
  brand_tone: string;
  outline: string[];
  sample_copy: string;
}

export interface BrandProfile {
  category: string;
  industry: string;
  target_audience: string;
  key_differentiators: string[];
}

export interface BrandAnalysisResponse {
  brand_profile: BrandProfile;
  executive_summary: string;
  competitive_landscape: string;
  sentiment_analysis: SentimentAnalysis;
  swot_analysis: SWOTAnalysis;
  competitive_ranking: CompetitiveRanking[];
  editorial_ideas: EditorialIdea[];
}

export interface SchemaMetadata {
  title?: string;
  description?: string;
  organization?: Record<string, unknown>;
  product?: Record<string, unknown>;
  faqPage?: Record<string, unknown>;
  review?: Record<string, unknown>;
  url: string;
}

export interface BrandAnalysisWithMetadata extends BrandAnalysisResponse {
  metadata: SchemaMetadata[];
  roastMode?: boolean;
  inputBrand?: string;
}

