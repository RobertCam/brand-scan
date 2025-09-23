'use client';

import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

interface CompetitiveScoreChartProps {
  data: BrandAnalysisWithMetadata;
  title?: string;
  className?: string;
}

export default function CompetitiveScoreChart({ data, title = "Competitive Score Breakdown", className = "" }: CompetitiveScoreChartProps) {
  // Sort competitors by overall score
  const sortedCompetitors = [...data.competitive_ranking].sort((a, b) => b.overall_score - a.overall_score);
  
  const metrics = [
    { key: 'sentiment', label: 'Sentiment', color: '#3B82F6' },
    { key: 'share_of_voice', label: 'Share of Voice', color: '#10B981' },
    { key: 'ai_readiness', label: 'AI Readiness', color: '#8B5CF6' },
    { key: 'seo_health', label: 'SEO Health', color: '#F59E0B' },
    { key: 'social_resonance', label: 'Social Resonance', color: '#EF4444' }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {/* Overall Scores */}
      <div className="space-y-3 mb-6">
        {sortedCompetitors.map((competitor, index) => (
          <div key={competitor.brand} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-sm">
                {index + 1}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{competitor.brand}</h4>
                <p className="text-xs text-gray-600">{competitor.ranking_justification}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{competitor.overall_score}</div>
              <div className="text-xs text-gray-500">/100</div>
            </div>
          </div>
        ))}
      </div>

      {/* Metric Breakdown */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">Score Breakdown by Metric</h4>
        {metrics.map((metric) => (
          <div key={metric.key} className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>{metric.label}</span>
            </div>
            <div className="space-y-1">
              {sortedCompetitors.map((competitor) => {
                const score = competitor.score_breakdown[metric.key as keyof typeof competitor.score_breakdown]?.score || 0;
                return (
                  <div key={`${competitor.brand}-${metric.key}`} className="flex items-center gap-2">
                    <div className="w-16 text-xs text-gray-600 truncate">{competitor.brand}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full" 
                        style={{ 
                          width: `${score}%`, 
                          backgroundColor: metric.color 
                        }}
                      ></div>
                    </div>
                    <div className="w-8 text-xs text-gray-600 text-right">{score}</div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>Detailed competitive analysis for {data.inputBrand || 'your brand'}</p>
      </div>
    </div>
  );
}

