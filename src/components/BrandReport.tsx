'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Download, FileText, FileDown, ExternalLink } from 'lucide-react';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface BrandReportProps {
  data: BrandAnalysisWithMetadata;
  onNewAnalysis: () => void;
}

export default function BrandReport({ data, onNewAnalysis }: BrandReportProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const reportRef = useRef<HTMLDivElement>(null);

  const sections = [
    { id: 'overview', title: 'Overview', icon: '📊' },
    { id: 'sentiment', title: 'Sentiment Analysis', icon: '💭' },
    { id: 'swot', title: 'SWOT Analysis', icon: '🔍' },
    { id: 'competitive', title: 'Competitive Ranking', icon: '🏆' },
    { id: 'recommendations', title: 'Recommendations', icon: '💡' },
    { id: 'editorial', title: 'Editorial Ideas', icon: '✍️' },
    { id: 'metadata', title: 'Schema Analysis', icon: '🏗️' },
  ];

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Add title
    pdf.setFontSize(24);
    pdf.text('Brand Analysis Report', margin, 30);

    // Add content (simplified for PDF)
    pdf.setFontSize(12);
    let yPosition = 50;

    // Overview
    pdf.setFontSize(16);
    pdf.text('Overview', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.text(`Brand: ${data.known[0] || 'N/A'}`, margin, yPosition);
    yPosition += 8;

    // Competitive Ranking
    pdf.setFontSize(16);
    pdf.text('Competitive Ranking', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    data.competitive_ranking.forEach((ranking, index) => {
      pdf.text(`${index + 1}. ${ranking.brand} - Score: ${ranking.overall}/100`, margin, yPosition);
      yPosition += 6;
    });

    pdf.save('brand-analysis-report.pdf');
  };

  const exportToMarkdown = () => {
    const markdown = `# Brand Analysis Report

## Overview
- **Brand**: ${data.known[0] || 'N/A'}
- **Analysis Date**: ${new Date().toLocaleDateString()}

## Sentiment Analysis
${Object.entries(data.sentiment_by_channel).map(([channel, score]) => 
  `- **${channel.charAt(0).toUpperCase() + channel.slice(1)}**: ${score}/100`
).join('\n')}

## Competitive Ranking
${data.competitive_ranking.map((ranking, index) => 
  `${index + 1}. **${ranking.brand}** - Overall Score: ${ranking.overall}/100
   - Sentiment: ${ranking.scores.sentiment}/100
   - Share of Voice: ${ranking.scores.sov}/100
   - AI Readiness: ${ranking.scores.ai_readiness}/100
   - SEO Health: ${ranking.scores.seo_health}/100
   - Social Resonance: ${ranking.scores.social_resonance}/100`
).join('\n\n')}

## SWOT Analysis
### Strengths
${data.swot.s.map(item => `- ${item.summary}`).join('\n')}

### Weaknesses
${data.swot.w.map(item => `- ${item.summary}`).join('\n')}

### Opportunities
${data.swot.o.map(item => `- ${item.summary}`).join('\n')}

### Threats
${data.swot.t.map(item => `- ${item.summary}`).join('\n')}

## Recommendations
${data.recommendations.map(rec => 
  `### ${rec.title}
**Channel**: ${rec.channel.toUpperCase()}
**Rationale**: ${rec.rationale}
**RICE Score**: Reach: ${rec.reach}, Impact: ${rec.impact}, Confidence: ${rec.confidence}, Effort: ${rec.effort}`
).join('\n\n')}

## Editorial Ideas
${data.editorial_ideas.map(idea => 
  `### ${idea.title}
**Format**: ${idea.format}
**Angle**: ${idea.angle}
**Outline**:
${idea.outline.map(point => `- ${point}`).join('\n')}`
).join('\n\n')}
`;

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-analysis-report.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreBarWidth = (score: number) => {
    return `${Math.max(score, 5)}%`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Brand Analysis Report</h1>
            <p className="text-blue-100">
              Analysis for: <span className="font-semibold">{data.known[0] || 'Unknown Brand'}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Export report to PDF"
            >
              <FileDown className="w-4 h-4" />
              PDF
            </button>
            <button
              onClick={exportToMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Export report to Markdown"
            >
              <FileText className="w-4 h-4" />
              Markdown
            </button>
            <button
              onClick={onNewAnalysis}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Start new brand analysis"
            >
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-gray-50 border-r border-gray-200 p-4" aria-label="Report sections">
          <div className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-800 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                )}
                aria-current={activeSection === section.id ? 'page' : undefined}
              >
                <span className="text-lg" aria-hidden="true">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-screen" role="main">
          <div ref={reportRef}>
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">Brand Information</h3>
                    <p className="text-blue-800">
                      <strong>Primary Brand:</strong> {data.known[0] || 'N/A'}
                    </p>
                    {data.known.length > 1 && (
                      <p className="text-blue-800 mt-2">
                        <strong>Related Brands:</strong> {data.known.slice(1).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">Analysis Summary</h3>
                    <p className="text-green-800">
                      Comprehensive analysis completed across web, news, forums, and social platforms.
                      Includes competitive ranking, SWOT analysis, and actionable recommendations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sentiment Analysis Section */}
            {activeSection === 'sentiment' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Sentiment Analysis</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(data.sentiment_by_channel).map(([channel, score]) => (
                    <div key={channel} className="bg-white border border-gray-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 capitalize mb-2">{channel}</h3>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={cn('h-2 rounded-full', getScoreColor(score).split(' ')[1])}
                            style={{ width: getScoreBarWidth(score) }}
                          />
                        </div>
                        <span className={cn('text-sm font-medium', getScoreColor(score).split(' ')[0])}>
                          {score}/100
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SWOT Analysis Section */}
            {activeSection === 'swot' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">SWOT Analysis</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    { key: 's', title: 'Strengths', color: 'green', items: data.swot.s },
                    { key: 'w', title: 'Weaknesses', color: 'red', items: data.swot.w },
                    { key: 'o', title: 'Opportunities', color: 'blue', items: data.swot.o },
                    { key: 't', title: 'Threats', color: 'orange', items: data.swot.t },
                  ].map(({ key, title, color, items }) => (
                    <div key={key} className={`bg-${color}-50 p-6 rounded-lg`}>
                      <h3 className={`text-lg font-semibold text-${color}-900 mb-4`}>{title}</h3>
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div key={index} className={`bg-white p-4 rounded-lg border border-${color}-200`}>
                            <p className={`text-${color}-800 font-medium mb-2`}>{item.summary}</p>
                            <p className={`text-${color}-700 text-sm`}>{item.rationale}</p>
                            {item.citations.length > 0 && (
                              <div className="mt-2">
                                <p className={`text-xs text-${color}-600`}>Sources:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.citations.slice(0, 3).map((citation, i) => (
                                    <a
                                      key={i}
                                      href={citation}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`text-xs px-2 py-1 bg-${color}-100 text-${color}-700 rounded hover:bg-${color}-200 transition-colors`}
                                    >
                                      <ExternalLink className="w-3 h-3 inline mr-1" />
                                      Source {i + 1}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Competitive Ranking Section */}
            {activeSection === 'competitive' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Competitive Ranking</h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rank
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Brand
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Overall Score
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sentiment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Share of Voice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            AI Readiness
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            SEO Health
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Social Resonance
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {data.competitive_ranking.map((ranking, index) => (
                          <tr key={ranking.brand} className={index === 0 ? 'bg-yellow-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {ranking.brand}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 w-20">
                                  <div
                                    className={cn('h-2 rounded-full', getScoreColor(ranking.overall).split(' ')[1])}
                                    style={{ width: getScoreBarWidth(ranking.overall) }}
                                  />
                                </div>
                                <span className={cn('text-sm font-medium', getScoreColor(ranking.overall).split(' ')[0])}>
                                  {ranking.overall}/100
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.scores.sentiment}/100
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.scores.sov}/100
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.scores.ai_readiness}/100
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.scores.seo_health}/100
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {ranking.scores.social_resonance}/100
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {activeSection === 'recommendations' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
                <div className="space-y-4">
                  {data.recommendations.map((rec, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          rec.channel === 'ai' ? 'bg-purple-100 text-purple-800' :
                          rec.channel === 'seo' ? 'bg-green-100 text-green-800' :
                          'bg-blue-100 text-blue-800'
                        )}>
                          {rec.channel.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{rec.rationale}</p>
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{rec.reach}</div>
                          <div className="text-xs text-gray-500">Reach</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{rec.impact}</div>
                          <div className="text-xs text-gray-500">Impact</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{rec.confidence}</div>
                          <div className="text-xs text-gray-500">Confidence</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{rec.effort}</div>
                          <div className="text-xs text-gray-500">Effort</div>
                        </div>
                      </div>
                      {rec.citations.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {rec.citations.slice(0, 3).map((citation, i) => (
                            <a
                              key={i}
                              href={citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 inline mr-1" />
                              Source {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editorial Ideas Section */}
            {activeSection === 'editorial' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Editorial Ideas</h2>
                <div className="space-y-4">
                  {data.editorial_ideas.map((idea, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          idea.format === 'faq' ? 'bg-blue-100 text-blue-800' :
                          idea.format === 'blog' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        )}>
                          {idea.format.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{idea.angle}</p>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Outline:</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {idea.outline.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                      {idea.citations.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {idea.citations.slice(0, 3).map((citation, i) => (
                            <a
                              key={i}
                              href={citation}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 inline mr-1" />
                              Source {i + 1}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schema Analysis Section */}
            {activeSection === 'metadata' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Schema.org Analysis</h2>
                <div className="space-y-4">
                  {data.metadata.map((meta, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        <a href={meta.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                          {meta.url} <ExternalLink className="w-4 h-4 inline ml-1" />
                        </a>
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Basic Metadata</h4>
                          {meta.title && (
                            <p className="text-sm text-gray-700 mb-1">
                              <strong>Title:</strong> {meta.title}
                            </p>
                          )}
                          {meta.description && (
                            <p className="text-sm text-gray-700">
                              <strong>Description:</strong> {meta.description}
                            </p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Structured Data</h4>
                          <div className="space-y-1">
                            {meta.organization && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                Organization
                              </span>
                            )}
                            {meta.product && (
                              <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded ml-1">
                                Product
                              </span>
                            )}
                            {meta.faqPage && (
                              <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded ml-1">
                                FAQ Page
                              </span>
                            )}
                            {meta.review && (
                              <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded ml-1">
                                Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

