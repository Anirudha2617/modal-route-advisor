import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter } from 'recharts';
import { TrendingUp, DollarSign, Clock, CheckCircle, AlertCircle, Download, Play, RotateCcw, TrendingDown, Target } from "lucide-react";

const Results = () => {
  const results = [
    {
      id: 1,
      modality: "Text",
      provider: "Claude-3.5-Sonnet",
      inputTokens: 1250,
      outputTokens: 320,
      cost: 0.89,
      latency: 1.2,
      quality: 0.94,
      status: "success"
    },
    {
      id: 2,
      modality: "Image",
      provider: "GPT-4o",
      inputTokens: 2100,
      outputTokens: 285,
      cost: 2.45,
      latency: 2.8,
      quality: 0.91,
      status: "success"
    },
    {
      id: 3,
      modality: "Audio",
      provider: "Gemini-1.5-Pro",
      inputTokens: 890,
      outputTokens: 310,
      cost: 1.23,
      latency: 4.2,
      quality: 0.87,
      status: "success"
    },
    {
      id: 4,
      modality: "Video",
      provider: "Gemini-1.5-Pro",
      inputTokens: 4500,
      outputTokens: 295,
      cost: 6.78,
      latency: 8.9,
      quality: 0.89,
      status: "success"
    },
    {
      id: 5,
      modality: "Text",
      provider: "GPT-4o-mini",
      inputTokens: 1250,
      outputTokens: 340,
      cost: 0.34,
      latency: 0.8,
      quality: 0.88,
      status: "success"
    },
    {
      id: 6,
      modality: "Image",
      provider: "Claude-3.5-Sonnet",
      inputTokens: 2100,
      outputTokens: 275,
      cost: 1.89,
      latency: 2.1,
      quality: 0.93,
      status: "success"
    }
  ];

  const recommendation = {
    cheapest: "GPT-4o-mini (Text)",
    cost: 0.34,
    qualityScore: 0.88,
    savings: 62.5,
    baseline: "GPT-4o (Image)"
  };

  const costData = [
    { modality: 'Text', cost: 0.02 },
    { modality: 'Image', cost: 0.08 },
    { modality: 'Audio', cost: 0.12 },
    { modality: 'Video', cost: 0.15 }
  ];

  const latencyData = [
    { provider: 'OpenAI', text: 1.2, image: 2.8, audio: 3.1 },
    { provider: 'Anthropic', text: 0.9, image: 2.1, audio: 0 },
    { provider: 'Google', text: 1.1, image: 2.3, audio: 4.2 }
  ];

  const getModalityIcon = (modality: string) => {
    const icons = {
      Text: "📄",
      Image: "🖼️",
      Audio: "🎵", 
      Video: "🎬"
    };
    return icons[modality as keyof typeof icons] || "📄";
  };

  const getQualityBadge = (quality: number) => {
    if (quality >= 0.9) return <Badge className="bg-success">Excellent</Badge>;
    if (quality >= 0.8) return <Badge variant="secondary">Good</Badge>;
    return <Badge variant="destructive">Fair</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
            Results & Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive results from our multimodal tokenization cost research
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Play className="mr-2 h-4 w-4" />
            Reproduce This Figure
          </Button>
          <Button className="bg-gradient-to-r from-tech-blue to-tech-purple">
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Research Citation Banner */}
      <Card className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border-neutral-200 dark:border-neutral-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                This analysis is powered by ModalRoute Playground, built for the research paper:
              </p>
              <p className="text-lg font-semibold text-tech-blue">
                "Multimodal Tokenization Cost Analysis: Finding the Optimal Route for AI Processing"
              </p>
              <p className="text-sm text-muted-foreground">
                Research Team, AI Conference 2024
              </p>
            </div>
            <Button variant="outline" size="sm">
              Cite This Work
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Results */}
      <Tabs defaultValue="charts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="charts">Interactive Charts</TabsTrigger>
          <TabsTrigger value="table">Detailed Results</TabsTrigger>
          <TabsTrigger value="recommendation">Cost Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Cost by Modality</CardTitle>
                    <CardDescription>Average processing cost across providers</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="modality" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cost" fill="hsl(var(--tech-blue))" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Reproduce This Figure
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">Cost vs Accuracy Trade-off</CardTitle>
                    <CardDescription>Performance efficiency across modalities</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={[
                    { cost: 0.02, accuracy: 94, modality: 'Text' },
                    { cost: 0.08, accuracy: 96, modality: 'Image' },
                    { cost: 0.12, accuracy: 92, modality: 'Audio' },
                    { cost: 0.15, accuracy: 93, modality: 'Video' }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="cost" name="Cost ($)" />
                    <YAxis dataKey="accuracy" name="Accuracy (%)" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter fill="hsl(var(--tech-purple))" />
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    Reproduce This Figure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Provider Latency Comparison</CardTitle>
                  <CardDescription>Processing time by modality across major providers</CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="provider" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="text" stroke="hsl(var(--tech-blue))" strokeWidth={2} />
                  <Line type="monotone" dataKey="image" stroke="hsl(var(--tech-purple))" strokeWidth={2} />
                  <Line type="monotone" dataKey="audio" stroke="hsl(var(--success))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm">
                  <Play className="mr-2 h-4 w-4" />
                  Reproduce This Figure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="table" className="space-y-6">
          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Results</CardTitle>
              <CardDescription>
                Performance metrics for each modality-provider combination
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Modality</TableHead>
                    <TableHead>Provider/Model</TableHead>
                    <TableHead>Input Tokens</TableHead>
                    <TableHead>Output Tokens</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getModalityIcon(result.modality)}</span>
                          <span>{result.modality}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{result.provider}</TableCell>
                      <TableCell className="text-muted-foreground">{result.inputTokens.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground">{result.outputTokens.toLocaleString()}</TableCell>
                      <TableCell className="font-medium">${result.cost.toFixed(2)}</TableCell>
                      <TableCell>{result.latency}s</TableCell>
                      <TableCell>{getQualityBadge(result.quality)}</TableCell>
                      <TableCell>
                        <Badge variant="default">Success</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendation" className="space-y-6">
          {/* Recommendation Card */}
          <Card className="border-success/20 bg-success/5">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-success" />
                <span>Recommended Route</span>
              </CardTitle>
              <CardDescription>
                Based on cost-quality analysis of your experiment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-2xl font-bold text-success">{recommendation.cheapest}</div>
                  <p className="text-sm text-muted-foreground">Cheapest viable route</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">${recommendation.cost}</div>
                  <p className="text-sm text-muted-foreground">Total cost</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{(recommendation.qualityScore * 100).toFixed(0)}%</div>
                  <p className="text-sm text-muted-foreground">Quality score</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success">{recommendation.savings}%</div>
                  <p className="text-sm text-muted-foreground">Cost savings vs {recommendation.baseline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Results;