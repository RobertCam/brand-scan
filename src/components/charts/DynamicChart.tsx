'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface DynamicChartProps {
  type: string;
  title: string;
  description: string;
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
  className?: string;
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function DynamicChart({ type, title, description, chartData, className = '' }: DynamicChartProps) {
  const renderMatrix = () => {
    if (!chartData?.matrix || !chartData?.categories || !chartData?.values) {
      return <div className="text-gray-500">Matrix data not available</div>;
    }

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-2 text-left font-semibold text-gray-900"></th>
                {chartData.categories.map((category, index) => (
                  <th key={index} className="border border-gray-300 p-2 text-center font-semibold text-gray-900">
                    {category}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chartData.matrix.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border border-gray-300 p-2 font-semibold bg-gray-50 text-gray-900">
                    {chartData.values?.[rowIndex] || ''}
                  </td>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 p-2 text-center">
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        cell.value >= 7 ? 'bg-green-100 text-gray-900' :
                        cell.value >= 5 ? 'bg-yellow-100 text-gray-900' :
                        cell.value >= 3 ? 'bg-orange-100 text-gray-900' :
                        'bg-red-100 text-gray-900'
                      }`}>
                        {cell.label}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderScatterPlot = () => {
    if (!chartData?.points) {
      return <div className="text-gray-500">Scatter plot data not available</div>;
    }

    const data = chartData.points.map(point => ({
      x: point.x,
      y: point.y,
      name: point.label
    }));

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" name="X Axis" />
            <YAxis dataKey="y" name="Y Axis" />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter dataKey="y" fill="#3B82F6" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!chartData?.labels || !chartData?.datasets) {
      return <div className="text-gray-500">Bar chart data not available</div>;
    }

    // Transform data for Recharts format
    const data = chartData.labels.map((label, index) => {
      const dataPoint: any = { name: label };
      chartData.datasets?.forEach((dataset, datasetIndex) => {
        if (Array.isArray(dataset.data)) {
          dataPoint[dataset.label] = dataset.data[index] || 0;
        }
      });
      return dataPoint;
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {chartData.datasets?.map((dataset, index) => (
                        <Bar 
                          key={dataset.label} 
                          dataKey={dataset.label} 
                          fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor || colors[index % colors.length]} 
                        />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderLineChart = () => {
    if (!chartData?.labels || !chartData?.datasets) {
      return <div className="text-gray-500">Line chart data not available</div>;
    }

    // Transform data for Recharts format
    const data = chartData.labels.map((label, index) => {
      const dataPoint: any = { name: label };
      chartData.datasets?.forEach((dataset, datasetIndex) => {
        if (Array.isArray(dataset.data)) {
          dataPoint[dataset.label] = dataset.data[index] || 0;
        }
      });
      return dataPoint;
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            {chartData.datasets?.map((dataset, index) => (
                        <Line 
                          key={dataset.label} 
                          type="monotone" 
                          dataKey={dataset.label} 
                          stroke={Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor || colors[index % colors.length]} 
                          strokeWidth={2} 
                        />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPieChart = () => {
    if (!chartData?.labels || !chartData?.datasets?.[0]?.data) {
      return <div className="text-gray-500">Pie chart data not available</div>;
    }

    const data = chartData.labels.map((label, index) => ({
      name: label,
      value: Array.isArray(chartData.datasets?.[0]?.data) ? chartData.datasets?.[0]?.data[index] : 0
    }));

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderAreaChart = () => {
    if (!chartData?.labels || !chartData?.datasets?.[0]?.data) {
      return <div className="text-gray-500">Area chart data not available</div>;
    }

    const data = chartData.labels.map((label, index) => ({
      name: label,
      value: Array.isArray(chartData.datasets?.[0]?.data) ? chartData.datasets?.[0]?.data[index] : 0
    }));

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderRadarChart = () => {
    if (!chartData?.labels || !chartData?.datasets) {
      return <div className="text-gray-500">Radar chart data not available</div>;
    }

    // Transform data for Recharts radar format
    const data = chartData.labels.map((label, index) => {
      const dataPoint: any = { subject: label };
      chartData.datasets?.forEach((dataset) => {
        if (Array.isArray(dataset.data)) {
          dataPoint[dataset.label] = dataset.data[index] || 0;
        }
      });
      return dataPoint;
    });

    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            {chartData.datasets?.map((dataset, index) => (
              <Radar 
                key={dataset.label} 
                name={dataset.label} 
                dataKey={dataset.label} 
                stroke={Array.isArray(dataset.borderColor) ? dataset.borderColor[0] : dataset.borderColor || colors[index % colors.length]} 
                fill={Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor || colors[index % colors.length]} 
                fillOpacity={0.3}
              />
            ))}
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderChart = () => {
    switch (type.toLowerCase()) {
      case 'matrix':
      case 'effort_vs_value_matrix':
      case 'priority_matrix':
        return renderMatrix();
      case 'scatter':
      case 'scatter_plot':
        return renderScatterPlot();
      case 'bar':
      case 'bar_chart':
        return renderBarChart();
      case 'line':
      case 'line_chart':
        return renderLineChart();
      case 'pie':
      case 'pie_chart':
        return renderPieChart();
      case 'area':
      case 'area_chart':
        return renderAreaChart();
      case 'radar':
      case 'radar_chart':
      case 'competitive_radar':
        return renderRadarChart();
      case 'score_breakdown':
        return renderBarChart();
      default:
        return (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>
            <p className="text-sm text-gray-500">
              Chart type &quot;{type}&quot; is not yet supported. Available types: matrix, scatter_plot, bar_chart, line_chart, pie_chart, area_chart, radar_chart, score_breakdown
            </p>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderChart()}
    </div>
  );
}
