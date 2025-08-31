import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, ZoomIn, ZoomOut, RotateCcw, Filter } from "lucide-react";
import { ChartData, ModelResponse, exportToCSV, transformDataForChart } from '@/services/aiModelsApi';

interface InteractiveChartProps {
  data: ModelResponse[];
  title?: string;
  className?: string;
}

const InteractiveChart: React.FC<InteractiveChartProps> = ({ 
  data, 
  title = "Comparison of Input Methods and Models",
  className = ""
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'cost' | 'processingTime' | 'performance'>('cost');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Transform data for chart
  const chartData = useMemo(() => {
    const transformed = transformDataForChart(data);
    
    // Filter by selected models if any are selected
    if (selectedModels.length > 0) {
      return transformed.map(item => ({
        ...item,
        models: Object.keys(item.models)
          .filter(model => selectedModels.includes(model))
          .reduce((acc, model) => {
            acc[model] = item.models[model];
            return acc;
          }, {} as typeof item.models)
      }));
    }
    
    return transformed;
  }, [data, selectedModels]);

  // Get all unique models from data
  const allModels = useMemo(() => {
    const models = new Set<string>();
    data.forEach(item => models.add(item.model));
    return Array.from(models);
  }, [data]);

  // Initialize selected models if empty
  React.useEffect(() => {
    if (selectedModels.length === 0 && allModels.length > 0) {
      setSelectedModels(allModels);
    }
  }, [allModels, selectedModels.length]);

  // Prepare data for recharts
  const rechartData = useMemo(() => {
    return chartData.map(item => {
      const result: any = { inputMethod: item.inputMethod };
      
      Object.keys(item.models).forEach(model => {
        result[model] = item.models[model][selectedMetric];
      });
      
      return result;
    });
  }, [chartData, selectedMetric]);

  // Color palette for different models
  const modelColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--muted))',
    'hsl(var(--success))',
    'hsl(var(--warning))',
    'hsl(var(--destructive))',
    'hsl(var(--info))',
  ];

  const getMetricLabel = (metric: string): string => {
    switch (metric) {
      case 'cost': return 'Cost ($)';
      case 'processingTime': return 'Processing Time (ms)';
      case 'performance': return 'Performance Score';
      default: return metric;
    }
  };

  const getMetricUnit = (metric: string): string => {
    switch (metric) {
      case 'cost': return '$';
      case 'processingTime': return 'ms';
      case 'performance': return '';
      default: return '';
    }
  };

  const handleModelToggle = (model: string, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, model]);
    } else {
      setSelectedModels(prev => prev.filter(m => m !== model));
    }
  };

  const downloadChart = () => {
    // This would typically use html2canvas or similar library
    console.log('Download chart functionality - implement with html2canvas');
  };

  const downloadCSV = () => {
    const csv = exportToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `model_comparison_${selectedMetric}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const stats = {
      avgCost: 0,
      avgTime: 0,
      avgPerformance: 0,
      bestCostModel: '',
      bestPerformanceModel: '',
      fastestModel: '',
    };

    if (data.length === 0) return stats;

    const costs = data.map(d => d.cost);
    const times = data.map(d => d.processingTime);
    const performances = data.map(d => d.performance.accuracy || 0);

    stats.avgCost = costs.reduce((a, b) => a + b, 0) / costs.length;
    stats.avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    stats.avgPerformance = performances.reduce((a, b) => a + b, 0) / performances.length;

    const minCostItem = data.find(d => d.cost === Math.min(...costs));
    const maxPerfItem = data.find(d => (d.performance.accuracy || 0) === Math.max(...performances));
    const minTimeItem = data.find(d => d.processingTime === Math.min(...times));

    stats.bestCostModel = minCostItem?.model || '';
    stats.bestPerformanceModel = maxPerfItem?.model || '';
    stats.fastestModel = minTimeItem?.model || '';

    return stats;
  }, [data]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">{title}</CardTitle>
              <CardDescription>
                Interactive visualization of AI model performance across different input methods
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button variant="outline" size="sm" onClick={resetZoom}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={downloadChart}>
                <Download className="mr-2 h-4 w-4" />
                PNG
              </Button>
              <Button variant="outline" size="sm" onClick={downloadCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Metric Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="cost">Cost</TabsTrigger>
                  <TabsTrigger value="processingTime">Time</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.25))}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Model Filters */}
            {showFilters && (
              <Card className="p-4">
                <h4 className="font-medium mb-3">Select Models to Display</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {allModels.map((model, index) => (
                    <div key={model} className="flex items-center space-x-2">
                      <Checkbox
                        id={`model-${model}`}
                        checked={selectedModels.includes(model)}
                        onCheckedChange={(checked) => handleModelToggle(model, checked as boolean)}
                      />
                      <label
                        htmlFor={`model-${model}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        <Badge 
                          variant="outline" 
                          style={{ borderColor: modelColors[index % modelColors.length] }}
                        >
                          {model}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Chart */}
            <div className="w-full overflow-x-auto">
              <div style={{ minWidth: `${800 * zoomLevel}px`, height: `${400 * zoomLevel}px` }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={rechartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="inputMethod" 
                      fontSize={12}
                      interval={0}
                    />
                    <YAxis 
                      fontSize={12}
                      label={{ 
                        value: getMetricLabel(selectedMetric), 
                        angle: -90, 
                        position: 'insideLeft' 
                      }}
                    />
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value}${getMetricUnit(selectedMetric)}`,
                        name
                      ]}
                      labelFormatter={(label) => `Input Method: ${label}`}
                    />
                    <Legend />
                    {allModels
                      .filter(model => selectedModels.includes(model))
                      .map((model, index) => (
                        <Bar
                          key={model}
                          dataKey={model}
                          fill={modelColors[index % modelColors.length]}
                          name={model}
                        />
                      ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Summary</CardTitle>
          <CardDescription>
            Key insights from the comparison analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-success">Most Cost Effective</h4>
              <p className="text-2xl font-bold">{summaryStats.bestCostModel}</p>
              <p className="text-sm text-muted-foreground">
                Avg Cost: ${summaryStats.avgCost.toFixed(4)}
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-primary">Highest Performance</h4>
              <p className="text-2xl font-bold">{summaryStats.bestPerformanceModel}</p>
              <p className="text-sm text-muted-foreground">
                Avg Performance: {(summaryStats.avgPerformance * 100).toFixed(1)}%
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-info">Fastest Processing</h4>
              <p className="text-2xl font-bold">{summaryStats.fastestModel}</p>
              <p className="text-sm text-muted-foreground">
                Avg Time: {summaryStats.avgTime.toFixed(0)}ms
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveChart;