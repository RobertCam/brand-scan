import html2canvas from 'html2canvas';
import * as domtoimage from 'dom-to-image';
import jsPDF from 'jspdf';
import { BrandAnalysisWithMetadata } from '@/types/brand-analysis';

export interface ChartExportData {
  id: string;
  type: string;
  title: string;
  description: string;
  insights: string[];
  pinnedAt: string;
  element?: HTMLElement;
}

export interface PDFExportOptions {
  title: string;
  subtitle?: string;
  includeInsights: boolean;
  includeMetadata: boolean;
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: number;
  quality: number;
}

export const DEFAULT_PDF_OPTIONS: PDFExportOptions = {
  title: 'Brand Analysis Report',
  subtitle: '',
  includeInsights: true,
  includeMetadata: true,
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 20,
  quality: 0.95
};

export class PDFExporter {
  private options: PDFExportOptions;
  private pdf: jsPDF;
  private currentY: number = 0;
  private pageHeight: number = 0;
  private pageWidth: number = 0;

  constructor(options: Partial<PDFExportOptions> = {}) {
    this.options = { ...DEFAULT_PDF_OPTIONS, ...options };
    this.pdf = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize
    });
    
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.currentY = this.options.margin;
  }

  async exportPinnedCharts(
    charts: ChartExportData[],
    brandData: BrandAnalysisWithMetadata,
    options: Partial<PDFExportOptions> = {}
  ): Promise<void> {
    this.options = { ...this.options, ...options };
    
    // Just capture the pinned charts section as a screenshot - no text, no title page
    await this.addPinnedChartsScreenshot();
    
    // Generate filename and download
    const filename = this.generateFilename(brandData);
    this.pdf.save(filename);
  }

  async exportSingleChart(
    chart: ChartExportData,
    brandData: BrandAnalysisWithMetadata,
    options: Partial<PDFExportOptions> = {}
  ): Promise<void> {
    this.options = { ...this.options, ...options };
    
    // Just capture the individual chart as a screenshot - no text, no title page
    await this.addSingleChartScreenshot(chart);
    
    // Generate filename and download
    const filename = this.generateChartFilename(chart, brandData);
    this.pdf.save(filename);
  }

  private async addTitlePage(brandData: BrandAnalysisWithMetadata): Promise<void> {
    // Reset to first page
    this.pdf = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize
    });
    
    this.currentY = this.options.margin;
    
    // Add logo/header
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(this.options.title, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;
    
    if (this.options.subtitle) {
      this.pdf.setFontSize(16);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(this.options.subtitle, this.pageWidth / 2, this.currentY, { align: 'center' });
      this.currentY += 10;
    }
    
    // Add brand name
    this.pdf.setFontSize(20);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(brandData.inputBrand || 'Unknown Brand', this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 20;
    
    // Add analysis type
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'normal');
    const analysisType = brandData.roastMode ? '🔥 Brand Burn Report' : '📊 Brand Scan Report';
    this.pdf.text(analysisType, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 15;
    
    // Add date
    this.pdf.setFontSize(12);
    this.pdf.text(`Generated on ${new Date().toLocaleDateString()}`, this.pageWidth / 2, this.currentY, { align: 'center' });
    this.currentY += 30;
    
    // Add brand profile summary
    if (this.options.includeMetadata && brandData.brand_profile) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Brand Profile', this.options.margin, this.currentY);
      this.currentY += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      const profile = brandData.brand_profile;
      const profileText = [
        `Category: ${profile.category}`,
        `Industry: ${profile.industry}`,
        `Target Audience: ${profile.target_audience}`,
        `Key Differentiators: ${profile.key_differentiators.join(', ')}`
      ];
      
      profileText.forEach(line => {
        this.pdf.text(line, this.options.margin, this.currentY);
        this.currentY += 5;
      });
      
      this.currentY += 10;
    }
    
    // Add executive summary if available
    if (this.options.includeMetadata && brandData.executive_summary) {
      this.pdf.setFontSize(14);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Executive Summary', this.options.margin, this.currentY);
      this.currentY += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      const summaryLines = this.wrapText(brandData.executive_summary, this.pageWidth - (this.options.margin * 2));
      summaryLines.forEach(line => {
        this.pdf.text(line, this.options.margin, this.currentY);
        this.currentY += 5;
      });
      
      this.currentY += 10;
    }
  }

  private async addBrandOverview(brandData: BrandAnalysisWithMetadata): Promise<void> {
    this.addNewPage();
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Brand Analysis Overview', this.options.margin, this.currentY);
    this.currentY += 15;
    
    // Sentiment Analysis
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Sentiment Analysis', this.options.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    Object.entries(brandData.sentiment_analysis).forEach(([channel, analysis]) => {
      const channelName = channel.charAt(0).toUpperCase() + channel.slice(1);
      this.pdf.text(`${channelName}: ${analysis.score}/100`, this.options.margin, this.currentY);
      this.currentY += 5;
    });
    
    this.currentY += 10;
    
    // Competitive Ranking
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Competitive Ranking', this.options.margin, this.currentY);
    this.currentY += 8;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    brandData.competitive_ranking.forEach((ranking, index) => {
      this.pdf.text(`${index + 1}. ${ranking.brand} (${ranking.overall_score}/100)`, this.options.margin, this.currentY);
      this.currentY += 5;
    });
  }

  private async addChartPage(chart: ChartExportData): Promise<void> {
    this.addNewPage();
    
    // Add chart title
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(chart.title, this.options.margin, this.currentY);
    this.currentY += 10;
    
    // Add chart description
    if (chart.description) {
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      const descriptionLines = this.wrapText(chart.description, this.pageWidth - (this.options.margin * 2));
      descriptionLines.forEach(line => {
        this.pdf.text(line, this.options.margin, this.currentY);
        this.currentY += 5;
      });
      this.currentY += 5;
    }
    
    // Capture chart element as image using screenshot approach
    if (chart.element) {
      try {
        console.log('Capturing chart:', chart.id, chart.element);
        console.log('Element dimensions:', chart.element.offsetWidth, chart.element.offsetHeight);
        
        // Wait a bit for any animations to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(chart.element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true, // Enable logging to see what's happening
          width: chart.element.offsetWidth,
          height: chart.element.offsetHeight,
          scrollX: 0,
          scrollY: 0,
          windowWidth: chart.element.offsetWidth,
          windowHeight: chart.element.offsetHeight,
          foreignObjectRendering: true,
          removeContainer: false,
          imageTimeout: 10000
        });
        
        console.log('Canvas created:', canvas.width, canvas.height);
        
        const imgData = canvas.toDataURL('image/png', this.options.quality);
        const imgWidth = this.pageWidth - (this.options.margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        console.log('Adding image to PDF:', imgWidth, imgHeight);
        
        // Check if image fits on current page
        if (this.currentY + imgHeight > this.pageHeight - this.options.margin) {
          this.addNewPage();
        }
        
        console.log('Adding image at position:', this.options.margin, this.currentY);
        
        // Test: Add a simple rectangle first to see if positioning works
        this.pdf.setFillColor(255, 0, 0);
        this.pdf.rect(this.options.margin, this.currentY, imgWidth, 10, 'F');
        this.currentY += 15;
        
        // Check if image data is valid
        console.log('Image data length:', imgData.length);
        console.log('Image data starts with:', imgData.substring(0, 50));
        
        // Try adding the image with different parameters
        try {
          this.pdf.addImage(imgData, 'PNG', this.options.margin, this.currentY, imgWidth, imgHeight);
          console.log('Image added successfully');
        } catch (imgError) {
          console.error('Error adding image to PDF:', imgError);
          this.pdf.text('Failed to add image to PDF', this.options.margin, this.currentY);
        }
        
        this.currentY += imgHeight + 10;
        
        console.log('Current Y position after adding image:', this.currentY);
        
      } catch (error) {
        console.error('Error capturing chart:', error);
        this.pdf.text('Chart could not be captured', this.options.margin, this.currentY);
        this.currentY += 10;
      }
    } else {
      console.warn('No chart element found for:', chart.id);
      this.pdf.text('Chart element not found', this.options.margin, this.currentY);
      this.currentY += 10;
    }
    
    // Add insights if enabled
    if (this.options.includeInsights && chart.insights && chart.insights.length > 0) {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Key Insights:', this.options.margin, this.currentY);
      this.currentY += 8;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      chart.insights.forEach(insight => {
        const insightLines = this.wrapText(`• ${insight}`, this.pageWidth - (this.options.margin * 2));
        insightLines.forEach(line => {
          this.pdf.text(line, this.options.margin, this.currentY);
          this.currentY += 5;
        });
        this.currentY += 2;
      });
    }
  }

  private async addInsightsSummary(charts: ChartExportData[]): Promise<void> {
    this.addNewPage();
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Chart Insights Summary', this.options.margin, this.currentY);
    this.currentY += 15;
    
    charts.forEach((chart, index) => {
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}. ${chart.title}`, this.options.margin, this.currentY);
      this.currentY += 8;
      
      if (chart.insights && chart.insights.length > 0) {
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'normal');
        
        chart.insights.forEach(insight => {
          const insightLines = this.wrapText(`• ${insight}`, this.pageWidth - (this.options.margin * 2));
          insightLines.forEach(line => {
            this.pdf.text(line, this.options.margin, this.currentY);
            this.currentY += 5;
          });
          this.currentY += 2;
        });
      }
      
      this.currentY += 5;
    });
  }

  private addNewPage(): void {
    if (this.currentY > this.options.margin) {
      this.pdf.addPage();
      this.currentY = this.options.margin;
    }
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private generateFilename(brandData: BrandAnalysisWithMetadata): string {
    const brand = brandData.inputBrand || 'brand';
    const type = brandData.roastMode ? 'burn-report' : 'analysis-report';
    const date = new Date().toISOString().split('T')[0];
    return `${brand}-${type}-${date}.pdf`;
  }

  private generateChartFilename(chart: ChartExportData, brandData: BrandAnalysisWithMetadata): string {
    const brand = brandData.inputBrand || 'brand';
    const chartTitle = chart.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const date = new Date().toISOString().split('T')[0];
    return `${brand}-${chartTitle}-${date}.pdf`;
  }

  private async addPinnedChartsScreenshot(): Promise<void> {
    // Find the pinned charts section - try multiple approaches
    let pinnedChartsSection = document.querySelector('[data-testid="pinned-charts-section"]');
    
    if (!pinnedChartsSection) {
      // Try to find by heading text
      const headings = document.querySelectorAll('h2');
      for (const heading of headings) {
        if (heading.textContent?.includes('📌 Pinned Charts')) {
          pinnedChartsSection = heading.closest('div');
          break;
        }
      }
    }
    
    if (!pinnedChartsSection) {
      console.error('Pinned charts section not found');
      return;
    }
    
    try {
      console.log('Found pinned charts section:', pinnedChartsSection);
      console.log('Section dimensions:', (pinnedChartsSection as HTMLElement).offsetWidth, (pinnedChartsSection as HTMLElement).offsetHeight);
      
      // Wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use dom-to-image instead of html2canvas to avoid OKLCH issues
      const dataUrl = await domtoimage.toPng(pinnedChartsSection as HTMLElement, {
        quality: 0.8,
        bgcolor: '#ffffff',
        width: (pinnedChartsSection as HTMLElement).offsetWidth,
        height: (pinnedChartsSection as HTMLElement).offsetHeight
      });
      
      console.log('Image captured with dom-to-image');
      
      // Create image element to get dimensions
      const img = new Image();
      img.src = dataUrl;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      
      const imgWidth = this.pageWidth - (this.options.margin * 2);
      const imgHeight = (img.height * imgWidth) / img.width;
      
      console.log('Adding image to PDF:', imgWidth, imgHeight);
      
      this.pdf.addImage(dataUrl, 'PNG', this.options.margin, this.options.margin, imgWidth, imgHeight);
      
      console.log('Image added successfully to PDF');
      
    } catch (error) {
      console.error('Error capturing pinned charts section:', error);
    }
  }

  private async addSingleChartScreenshot(chart: ChartExportData): Promise<void> {
    this.addNewPage();
    
    if (!chart.element) {
      this.pdf.text('Chart element not found', this.options.margin, this.currentY);
      return;
    }
    
    try {
      console.log('Capturing single chart:', chart.id, chart.element);
      
      // Wait for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(chart.element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: chart.element.offsetWidth,
        height: chart.element.offsetHeight
      });
      
      const imgData = canvas.toDataURL('image/png', this.options.quality);
      const imgWidth = this.pageWidth - (this.options.margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Check if image fits on current page
      if (this.currentY + imgHeight > this.pageHeight - this.options.margin) {
        this.addNewPage();
      }
      
      this.pdf.addImage(imgData, 'PNG', this.options.margin, this.currentY, imgWidth, imgHeight);
      this.currentY += imgHeight + 10;
      
    } catch (error) {
      console.error('Error capturing single chart:', error);
      this.pdf.text('Could not capture chart', this.options.margin, this.currentY);
    }
  }

}

// Utility functions for easy use
export async function exportPinnedChartsToPDF(
  charts: ChartExportData[],
  brandData: BrandAnalysisWithMetadata,
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  const exporter = new PDFExporter(options);
  await exporter.exportPinnedCharts(charts, brandData);
}

export async function exportSingleChartToPDF(
  chart: ChartExportData,
  brandData: BrandAnalysisWithMetadata,
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  const exporter = new PDFExporter(options);
  await exporter.exportSingleChart(chart, brandData);
}

export async function exportChartElementToPDF(
  element: HTMLElement,
  title: string,
  options: Partial<PDFExportOptions> = {}
): Promise<void> {
  const chartData: ChartExportData = {
    id: 'single-chart',
    type: 'custom',
    title,
    description: '',
    insights: [],
    pinnedAt: new Date().toISOString(),
    element
  };
  
  const brandData: BrandAnalysisWithMetadata = {
    inputBrand: 'Chart Export',
    roastMode: false,
    brand_profile: {
      category: '',
      industry: '',
      target_audience: '',
      key_differentiators: []
    },
    executive_summary: '',
    competitive_landscape: '',
    sentiment_analysis: {
      web: { score: 0, explanation: '', key_insights: [], sources: [] },
      news: { score: 0, explanation: '', key_insights: [], sources: [] },
      forums: { score: 0, explanation: '', key_insights: [], sources: [] },
      social: { score: 0, explanation: '', key_insights: [], sources: [] }
    },
    swot_analysis: {
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
    },
    competitive_ranking: [],
    editorial_ideas: [],
    metadata: []
  };
  
  const exporter = new PDFExporter(options);
  await exporter.exportSingleChart(chartData, brandData);
}
