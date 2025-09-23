'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

interface CompetitiveRadarChartProps {
  data: BrandAnalysisWithMetadata;
  title?: string;
  className?: string;
}

export default function CompetitiveRadarChart({ data, title = "Competitive Analysis", className = "" }: CompetitiveRadarChartProps) {
  // Prepare data for radar chart
  const metrics = ['Sentiment', 'Share of Voice', 'AI Readiness', 'SEO Health', 'Social Resonance'];
  
  const chartData = metrics.map(metric => {
    const metricKey = metric.toLowerCase().replace(' ', '_').replace(' ', '_') as keyof typeof data.competitive_ranking[0]['score_breakdown'];
    
    const dataPoint: Record<string, string | number> = { metric };
    
    // Add data for each competitor
    data.competitive_ranking.forEach((competitor) => {
      const score = competitor.score_breakdown[metricKey]?.score || 0;
      dataPoint[competitor.brand] = score;
    });
    
    return dataPoint;
  });

  // Generate colors for competitors
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      name: string;
      value: number;
      color: string;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}/100
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 20, right: 80, bottom: 20, left: 20 }}>
            <PolarGrid stroke="#E5E7EB" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <PolarRadiusAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 10, fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {data.competitive_ranking.map((competitor, index) => (
              <Radar
                key={competitor.brand}
                name={competitor.brand}
                dataKey={competitor.brand}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Multi-dimensional comparison across key metrics for {data.competitive_ranking.length} competitors</p>
      </div>
    </div>
  );
}

