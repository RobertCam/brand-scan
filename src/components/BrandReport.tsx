'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, FileText, ExternalLink, MessageCircle, Palette } from 'lucide-react';
import { track } from '@vercel/analytics';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';
import { cn } from '@/lib/utils';
import ChatDrawer from './ChatDrawer';
import ColorPicker from './ColorPicker';
import { DynamicChart, SentimentBarChart, CompetitiveRadarChart, CompetitiveScoreChart } from './charts';
import { ChartColorSettings, DEFAULT_COLOR_SETTINGS, getThemeColors } from '@/lib/chart-themes';
import { PDFExportOptions, ChartExportData, exportPinnedChartsToPDF } from '@/lib/pdf-export';

interface BrandReportProps {
  data: BrandAnalysisWithMetadata;
  onNewAnalysis: () => void;
}

export default function BrandReport({ data, onNewAnalysis }: BrandReportProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pinnedCharts, setPinnedCharts] = useState<Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    data: unknown;
    insights: string[];
    pinnedAt: string;
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
  }>>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [colorSettings, setColorSettings] = useState<ChartColorSettings>(DEFAULT_COLOR_SETTINGS);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Load chat preference from localStorage on component mount
  useEffect(() => {
    const savedChatPreference = localStorage.getItem('chat-drawer-open');
    if (savedChatPreference !== null) {
      setIsChatOpen(JSON.parse(savedChatPreference));
    }
  }, []);

  // Save chat preference to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chat-drawer-open', JSON.stringify(isChatOpen));
  }, [isChatOpen]);

  // Load color settings from localStorage on component mount
  useEffect(() => {
    const savedColorSettings = localStorage.getItem(`chart-colors-${data.inputBrand}`);
    if (savedColorSettings) {
      try {
        setColorSettings(JSON.parse(savedColorSettings));
      } catch (error) {
        console.error('Error loading color settings:', error);
      }
    }
  }, [data.inputBrand]);

  // Save color settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`chart-colors-${data.inputBrand}`, JSON.stringify(colorSettings));
  }, [colorSettings, data.inputBrand]);
  
  // Sort competitive ranking by overall score (highest first)
  const sortedCompetitiveRanking = [...data.competitive_ranking].sort((a, b) => b.overall_score - a.overall_score);

  // Load pinned charts from localStorage on component mount
  useEffect(() => {
    const savedCharts = localStorage.getItem(`pinned-charts-${data.inputBrand}`);
    if (savedCharts) {
      try {
        setPinnedCharts(JSON.parse(savedCharts));
      } catch (error) {
        console.error('Error loading pinned charts:', error);
      }
    }
  }, [data.inputBrand]);

  // Save pinned charts to localStorage whenever they change
  useEffect(() => {
    if (pinnedCharts.length > 0) {
      localStorage.setItem(`pinned-charts-${data.inputBrand}`, JSON.stringify(pinnedCharts));
    } else {
      localStorage.removeItem(`pinned-charts-${data.inputBrand}`);
    }
  }, [pinnedCharts, data.inputBrand]);

  // Handle pinning a chart
  const handlePinChart = (chart: {
    type: string;
    title: string;
    description: string;
    data: unknown;
    insights: string[];
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
  }) => {
    const chartWithId = {
      ...chart,
      id: `${chart.type}-${Date.now()}`,
      pinnedAt: new Date().toISOString(),
    };
    setPinnedCharts(prev => [...prev, chartWithId]);
    
    // Track pinning action
    track('chart_pinned', {
      chart_type: chart.type,
      brand: data.inputBrand || 'unknown',
      roast_mode: data.roastMode || false,
    });
  };

  // Handle removing a pinned chart
  const handleUnpinChart = (chartId: string) => {
    setPinnedCharts(prev => prev.filter(chart => chart.id !== chartId));
    
    // Track unpinning action
    track('chart_unpinned', {
      brand: data.inputBrand || 'unknown',
      roast_mode: data.roastMode || false,
    });
  };

  // Get colors for a specific chart
  const getChartColors = (chartId: string) => {
    if (colorSettings.applyToAllCharts) {
      return getThemeColors(colorSettings.themeId, colorSettings.customColors).primary;
    }
    
    const chartSpecificColors = colorSettings.chartSpecificColors?.[chartId];
    if (chartSpecificColors && chartSpecificColors.length > 0) {
      return chartSpecificColors;
    }
    
    return getThemeColors(colorSettings.themeId, colorSettings.customColors).primary;
  };

  // Update colors for a specific chart
  const updateChartColors = (chartId: string, colors: string[]) => {
    setColorSettings(prev => ({
      ...prev,
      chartSpecificColors: {
        ...prev.chartSpecificColors,
        [chartId]: colors
      }
    }));
  };

  // Export pinned charts to PDF
  const handleExportPinnedChartsToPDF = async (options: PDFExportOptions) => {
    setIsExportingPDF(true);
    
    try {
      // Track export action
      track('pdf_exported', {
        type: 'pinned_charts',
        brand: data.inputBrand || 'unknown',
        roast_mode: data.roastMode || false,
        chart_count: pinnedCharts.length,
        include_insights: options.includeInsights,
        include_metadata: options.includeMetadata,
      });

      // Wait for charts to render
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Prepare chart data for export
      const chartExportData: ChartExportData[] = pinnedCharts.map(chart => {
        const element = document.getElementById(`chart-${chart.id}`) as HTMLElement;
        if (!element) {
          console.warn(`Chart element not found: chart-${chart.id}`);
          return null;
        }
        
        console.log('Found chart element:', chart.id, element);
        console.log('Element children:', element.children.length);
        
        // For now, let's try capturing the entire chart container
        // This should include the chart title, description, and the actual chart
        let chartContent = element;
        
        console.log('Chart content element:', chartContent);
        console.log('Content dimensions:', chartContent.offsetWidth, chartContent.offsetHeight);
        
        return {
          id: chart.id,
          type: chart.type,
          title: chart.title,
          description: chart.description,
          insights: chart.insights,
          pinnedAt: chart.pinnedAt,
          element: chartContent as HTMLElement
        };
      }).filter(chart => chart !== null) as ChartExportData[];

      // Set default title if not provided
      const exportOptions = {
        ...options,
        title: options.title || `${data.inputBrand || 'Brand'} Analysis Report`,
        subtitle: options.subtitle || (data.roastMode ? '🔥 Brand Burn Report' : '📊 Brand Scan Report')
      };

      await exportPinnedChartsToPDF(chartExportData, data, exportOptions);
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const sections = [
    { id: 'overview', title: 'Brand Overview', icon: '📊' },
    { id: 'sentiment', title: 'Sentiment Analysis', icon: '💭' },
    { id: 'swot', title: 'SWOT Analysis', icon: '🔍' },
    { id: 'competitive', title: 'Competitive Ranking', icon: '🏆' },
    { id: 'editorial', title: 'Editorial Ideas', icon: '✍️' },
    ...(pinnedCharts.length > 0 ? [{ id: 'pinned-charts', title: 'Pinned Charts', icon: '📌' }] : []),
  ];


  const exportToMarkdown = () => {
    // Track export action
    track('report_exported', {
      format: 'markdown',
      brand: data.inputBrand || 'unknown',
      roast_mode: data.roastMode || false,
      analysis_type: data.roastMode ? 'burn_report' : 'professional',
    });

    const markdown = `# ${data.roastMode ? '🔥 Brand Burn Report' : 'Brand Scan Report'}

## Brand Profile
- **Category**: ${data.brand_profile.category}
- **Industry**: ${data.brand_profile.industry}
- **Target Audience**: ${data.brand_profile.target_audience}
- **Key Differentiators**:
${data.brand_profile.key_differentiators.map(diff => `  - ${diff}`).join('\n')}

## Executive Summary
${data.executive_summary}

## Competitive Landscape
${data.competitive_landscape}

## Sentiment Analysis
${Object.entries(data.sentiment_analysis).map(([channel, analysis]) => 
  `### ${channel.charAt(0).toUpperCase() + channel.slice(1)} (${analysis.score}/100)
**Analysis**: ${analysis.explanation}

**Key Insights**:
${analysis.key_insights.map((insight: string) => `- ${insight}`).join('\n')}`
).join('\n\n')}

## SWOT Analysis
### Strengths
${data.swot_analysis.strengths.map(item => 
  `- **${item.summary}**: ${item.rationale}
  - *Competitor Context*: ${item.competitor_context}`
).join('\n\n')}

### Weaknesses
${data.swot_analysis.weaknesses.map(item => 
  `- **${item.summary}**: ${item.rationale}
  - *Competitor Context*: ${item.competitor_context}`
).join('\n\n')}

### Opportunities
${data.swot_analysis.opportunities.map(item => 
  `- **${item.summary}**: ${item.rationale}
  - *Competitor Context*: ${item.competitor_context}`
).join('\n\n')}

### Threats
${data.swot_analysis.threats.map(item => 
  `- **${item.summary}**: ${item.rationale}
  - *Competitor Context*: ${item.competitor_context}`
).join('\n\n')}

## Competitive Ranking
${sortedCompetitiveRanking.map((ranking, index) => 
  `### ${index + 1}. ${ranking.brand} (${ranking.overall_score}/100)
**Justification**: ${ranking.ranking_justification}

**Score Breakdown**:
- Sentiment: ${ranking.score_breakdown.sentiment.score}/100 - ${ranking.score_breakdown.sentiment.explanation}
- Share of Voice: ${ranking.score_breakdown.share_of_voice.score}/100 - ${ranking.score_breakdown.share_of_voice.explanation}
- AI Readiness: ${ranking.score_breakdown.ai_readiness.score}/100 - ${ranking.score_breakdown.ai_readiness.explanation}
- SEO Health: ${ranking.score_breakdown.seo_health.score}/100 - ${ranking.score_breakdown.seo_health.explanation}
- Social Resonance: ${ranking.score_breakdown.social_resonance.score}/100 - ${ranking.score_breakdown.social_resonance.explanation}`
).join('\n\n')}

## Editorial Ideas
${data.editorial_ideas.map(idea => 
  `### ${idea.title}
**Format**: ${idea.format.replace('_', ' ').toUpperCase()}
**Angle**: ${idea.angle}
**Brand Tone**: ${idea.brand_tone}

**Content Outline**:
${idea.outline.map((point, i) => `${i + 1}. ${point}`).join('\n')}

**Sample Copy**:
> ${idea.sample_copy}`
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
    <div className="bg-white rounded-2xl shadow-xl">
      {/* Report Header - Fixed */}
      <header className={`sticky top-0 z-30 bg-gradient-to-r ${data.roastMode ? 'from-orange-600 to-red-600' : 'from-blue-600 to-blue-700'} text-white p-6`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {data.roastMode ? '🔥 Brand Burn Report' : 'Brand Scan Report'}
            </h1>
            <p className="text-blue-100">
              Analysis for: <span className="font-semibold">{data.inputBrand || 'Unknown Brand'}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                track('chat_opened', {
                  brand: data.inputBrand || 'unknown',
                  roast_mode: data.roastMode || false,
                });
                setIsChatOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Ask questions about the report"
            >
              <MessageCircle className="w-4 h-4" />
              Ask Questions
            </button>
            <button
              onClick={exportToMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Export report to Markdown"
            >
              <FileText className="w-4 h-4" />
              Export Markdown
            </button>
            <button
              onClick={() => {
                track('new_analysis_started', {
                  previous_brand: data.inputBrand || 'unknown',
                  previous_roast_mode: data.roastMode || false,
                });
                onNewAnalysis();
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
              aria-label="Start new brand analysis"
            >
              <ArrowLeft className="w-4 h-4" />
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar Navigation */}
        <nav className={`bg-gray-50 border-r border-gray-200 transition-all duration-300 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto ${
          isSidebarCollapsed ? 'w-16 lg:w-16' : 'w-full lg:w-80'
        }`} aria-label="Report sections">
          <div className="p-4">
            {/* Collapse/Expand Toggle */}
            <div className="flex items-center justify-between mb-4">
              {!isSidebarCollapsed && (
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                  Report Sections
                </h3>
              )}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isSidebarCollapsed ? (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>
            </div>
            
            <div className="space-y-1 lg:space-y-1 flex flex-wrap lg:flex-col gap-2 lg:gap-0">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full lg:w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap',
                    activeSection === section.id
                      ? 'bg-blue-100 text-blue-800 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
                    isSidebarCollapsed && 'justify-center'
                  )}
                  aria-current={activeSection === section.id ? 'page' : undefined}
                  title={isSidebarCollapsed ? section.title : undefined}
                >
                  <span className="text-lg" aria-hidden="true">{section.icon}</span>
                  {!isSidebarCollapsed && section.title}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8" role="main">
          <div ref={reportRef}>
            {/* Brand Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-8">
                {/* Brand Profile */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Brand Profile</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium text-gray-900">Category:</span>
                            <span className="ml-2 text-gray-700">{data.brand_profile.category}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">Industry:</span>
                            <span className="ml-2 text-gray-700">{data.brand_profile.industry}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-900">Target Audience:</span>
                            <span className="ml-2 text-gray-700">{data.brand_profile.target_audience}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Differentiators</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {data.brand_profile.key_differentiators.map((diff, index) => (
                            <li key={index}>{diff}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Competitive Preview */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Competitive Landscape Preview</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Top Competitors</h3>
                      <div className="flex flex-wrap gap-2">
                        {sortedCompetitiveRanking.slice(0, 4).map((ranking, index) => (
                          <span
                            key={ranking.brand}
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              index === 0 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`} {ranking.brand} ({ranking.overall_score}/100)
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {data.competitive_landscape}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {data.executive_summary}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sentiment Analysis Section */}
            {activeSection === 'sentiment' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Sentiment Analysis</h2>
                <div className="space-y-6">
                  {Object.entries(data.sentiment_analysis).map(([channel, analysis]) => (
                    <div key={channel} className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 capitalize">{channel}</h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-3">
                              <div
                                className={cn('h-3 rounded-full', getScoreColor(analysis.score).split(' ')[1])}
                                style={{ width: getScoreBarWidth(analysis.score) }}
                              />
                            </div>
                            <span className={cn('text-lg font-bold', getScoreColor(analysis.score).split(' ')[0])}>
                              {analysis.score}/100
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Analysis</h4>
                        <p className="text-gray-700">{analysis.explanation}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          {analysis.key_insights.map((insight: string, index: number) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {analysis.sources.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Sources</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.sources.map((source: string, index: number) => (
                              <a
                                key={index}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3 inline mr-1" />
                                Source {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
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
                    { key: 'strengths', title: 'Strengths', items: data.swot_analysis.strengths },
                    { key: 'weaknesses', title: 'Weaknesses', items: data.swot_analysis.weaknesses },
                    { key: 'opportunities', title: 'Opportunities', items: data.swot_analysis.opportunities },
                    { key: 'threats', title: 'Threats', items: data.swot_analysis.threats },
                  ].map(({ key, title, items }) => (
                    <div key={key} className={cn(
                      'p-6 rounded-lg',
                      key === 'strengths' ? 'bg-green-50' :
                      key === 'weaknesses' ? 'bg-red-50' :
                      key === 'opportunities' ? 'bg-blue-50' :
                      'bg-orange-50'
                    )}>
                      <h3 className={cn(
                        'text-lg font-semibold mb-4',
                        key === 'strengths' ? 'text-green-900' :
                        key === 'weaknesses' ? 'text-red-900' :
                        key === 'opportunities' ? 'text-blue-900' :
                        'text-orange-900'
                      )}>{title}</h3>
                      <div className="space-y-4">
                        {items.map((item, index) => (
                          <div key={index} className={cn(
                            'bg-white p-4 rounded-lg border',
                            key === 'strengths' ? 'border-green-200' :
                            key === 'weaknesses' ? 'border-red-200' :
                            key === 'opportunities' ? 'border-blue-200' :
                            'border-orange-200'
                          )}>
                            <p className={cn(
                              'font-semibold mb-2',
                              key === 'strengths' ? 'text-green-900' :
                              key === 'weaknesses' ? 'text-red-900' :
                              key === 'opportunities' ? 'text-blue-900' :
                              'text-orange-900'
                            )}>{item.summary}</p>
                            <p className={cn(
                              'text-sm mb-2',
                              key === 'strengths' ? 'text-green-800' :
                              key === 'weaknesses' ? 'text-red-800' :
                              key === 'opportunities' ? 'text-blue-800' :
                              'text-orange-800'
                            )}>{item.rationale}</p>
                            <div className={cn(
                              'text-sm mb-3',
                              key === 'strengths' ? 'text-green-800' :
                              key === 'weaknesses' ? 'text-red-800' :
                              key === 'opportunities' ? 'text-blue-800' :
                              'text-orange-800'
                            )}>
                              <strong>Competitor Context:</strong> {item.competitor_context}
                            </div>
                            {item.sources.length > 0 && (
                              <div>
                                <p className={cn(
                                  'text-xs mb-1',
                                  key === 'strengths' ? 'text-green-700' :
                                  key === 'weaknesses' ? 'text-red-700' :
                                  key === 'opportunities' ? 'text-blue-700' :
                                  'text-orange-700'
                                )}>Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {item.sources.slice(0, 3).map((source, i) => (
                                    <a
                                      key={i}
                                      href={source}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        'text-xs px-2 py-1 rounded transition-colors',
                                        key === 'strengths' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                        key === 'weaknesses' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                        key === 'opportunities' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                                        'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                      )}
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
                <div className="space-y-6">
                  {sortedCompetitiveRanking.map((ranking, index) => (
                    <div key={ranking.brand} className={`bg-white border border-gray-200 rounded-lg p-6 ${index === 0 ? 'ring-2 ring-yellow-400' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </span>
                          <h3 className="text-xl font-bold text-gray-900">{ranking.brand}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-3">
                            <div
                              className={cn('h-3 rounded-full', getScoreColor(ranking.overall_score).split(' ')[1])}
                              style={{ width: getScoreBarWidth(ranking.overall_score) }}
                            />
                          </div>
                          <span className={cn('text-lg font-bold', getScoreColor(ranking.overall_score).split(' ')[0])}>
                            {ranking.overall_score}/100
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Ranking Justification</h4>
                        <p className="text-gray-700">{ranking.ranking_justification}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {Object.entries(ranking.score_breakdown).map(([metric, data]) => (
                          <div key={metric} className="bg-gray-50 p-3 rounded-lg">
                            <h5 className="font-medium text-gray-900 capitalize mb-1">
                              {metric.replace('_', ' ')}
                            </h5>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={cn('h-2 rounded-full', getScoreColor(data.score).split(' ')[1])}
                                  style={{ width: getScoreBarWidth(data.score) }}
                                />
                              </div>
                              <span className={cn('text-sm font-medium', getScoreColor(data.score).split(' ')[0])}>
                                {data.score}/100
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">{data.explanation}</p>
                          </div>
                        ))}
                      </div>
                      
                      {ranking.sources.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Sources</h4>
                          <div className="flex flex-wrap gap-2">
                            {ranking.sources.map((source, i) => (
                              <a
                                key={i}
                                href={source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
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
            )}


            {/* Editorial Ideas Section */}
            {activeSection === 'editorial' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Editorial Ideas</h2>
                <div className="space-y-6">
                  {data.editorial_ideas.map((idea, index) => (
                    <div key={index} className="bg-white border border-gray-200 p-6 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{idea.title}</h3>
                        <span className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          idea.format === 'faq' ? 'bg-blue-100 text-blue-800' :
                          idea.format === 'blog' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        )}>
                          {idea.format.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Angle</h4>
                        <p className="text-gray-700">{idea.angle}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Brand Tone</h4>
                        <p className="text-gray-700">{idea.brand_tone}</p>
                      </div>
                      
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">Content Outline</h4>
                        <ol className="list-decimal list-inside space-y-1 text-gray-700">
                          {idea.outline.map((point, i) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ol>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Sample Copy</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-700 italic leading-relaxed whitespace-pre-line">
                            {idea.sample_copy}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pinned Charts Section */}
            {activeSection === 'pinned-charts' && (
              <div className="space-y-6" data-testid="pinned-charts-section">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">📌 Pinned Charts</h2>
                  <div className="flex items-center gap-4">
                    <p className="text-sm text-gray-600">
                      Charts you&apos;ve pinned from chat conversations
                    </p>
                    {pinnedCharts.length > 0 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleExportPinnedChartsToPDF}
                          disabled={isExportingPDF}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          {isExportingPDF ? 'Exporting...' : 'Export PDF'}
                        </button>
                        <ColorPicker
                          selectedColors={getChartColors('global')}
                          onColorsChange={(colors) => {
                            setColorSettings(prev => ({
                              ...prev,
                              customColors: colors,
                              applyToAllCharts: true
                            }));
                          }}
                        />
                        <button
                          onClick={() => setColorSettings(prev => ({ ...prev, applyToAllCharts: !prev.applyToAllCharts }))}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            colorSettings.applyToAllCharts
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          <Palette className="w-4 h-4 inline mr-1" />
                          {colorSettings.applyToAllCharts ? 'Global Colors' : 'Individual Colors'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {pinnedCharts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pinned Charts Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Pin charts from your chat conversations to create a personalized dashboard
                    </p>
                    <button
                      onClick={() => setIsChatOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Open Chat to Pin Charts
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pinnedCharts.map((chart) => (
                      <div key={chart.id} id={`chart-${chart.id}`} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{chart.title}</h3>
                            <p className="text-sm text-gray-600">{chart.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Pinned on {new Date(chart.pinnedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {!colorSettings.applyToAllCharts && (
                              <ColorPicker
                                selectedColors={getChartColors(chart.id)}
                                onColorsChange={(colors) => updateChartColors(chart.id, colors)}
                                className="scale-90"
                              />
                            )}
                            <button
                              onClick={() => handleUnpinChart(chart.id)}
                              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                              title="Remove this chart from pinned charts"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                        
                        {/* Render the chart using original components for prebuilt charts */}
                        {chart.type === 'sentiment_bar' && (
                          <SentimentBarChart data={chart.data as BrandAnalysisWithMetadata} />
                        )}
                        {chart.type === 'competitive_radar' && (
                          <CompetitiveRadarChart data={chart.data as BrandAnalysisWithMetadata} />
                        )}
                        {chart.type === 'score_breakdown' && (
                          <CompetitiveScoreChart data={chart.data as BrandAnalysisWithMetadata} />
                        )}
                        {/* Use DynamicChart only for custom charts */}
                        {!['sentiment_bar', 'competitive_radar', 'score_breakdown'].includes(chart.type) && (
                          <DynamicChart
                            type={chart.type}
                            title=""
                            description=""
                            chartData={chart.chartData}
                            className="border-0 p-0"
                            customColors={getChartColors(chart.id)}
                          />
                        )}
                        
                        {/* Chart insights */}
                        {chart.insights && chart.insights.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h4 className="font-semibold text-gray-900 text-sm mb-2">Key Insights:</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {chart.insights.map((insight: string, index: number) => (
                                <li key={index}>• {insight}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Chat Drawer */}
      <ChatDrawer 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        reportData={data}
        onPinChart={handlePinChart}
      />
    </div>
  );
}


