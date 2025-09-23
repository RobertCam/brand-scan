'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

interface SentimentBarChartProps {
  data: BrandAnalysisWithMetadata;
  title?: string;
  className?: string;
}

export default function SentimentBarChart({ data, title = "Sentiment Analysis", className = "" }: SentimentBarChartProps) {
  const chartData = [
    {
      channel: 'Web',
      score: data.sentiment_analysis.web.score,
      color: '#3B82F6',
      explanation: data.sentiment_analysis.web.explanation
    },
    {
      channel: 'News',
      score: data.sentiment_analysis.news.score,
      color: '#10B981',
      explanation: data.sentiment_analysis.news.explanation
    },
    {
      channel: 'Forums',
      score: data.sentiment_analysis.forums.score,
      color: '#F59E0B',
      explanation: data.sentiment_analysis.forums.explanation
    },
    {
      channel: 'Social',
      score: data.sentiment_analysis.social.score,
      color: '#EF4444',
      explanation: data.sentiment_analysis.social.explanation
    }
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label} Sentiment</p>
          <p className="text-blue-600 font-medium">{data.score}/100</p>
          <p className="text-sm text-gray-600 mt-1">{data.explanation}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="channel" 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="score" 
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        <p>Sentiment scores across different channels for {data.inputBrand || 'your brand'}</p>
      </div>
    </div>
  );
}

