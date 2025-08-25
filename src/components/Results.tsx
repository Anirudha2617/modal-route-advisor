import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BarChart, 
  Download, 
  Filter,
  TrendingDown,
  TrendingUp,
  Clock,
  DollarSign,
  Target
} from "lucide-react";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Experiment Results</h1>
          <p className="text-muted-foreground">Product Requirements Document - Q&A Extraction</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

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

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${results.reduce((sum, r) => sum + r.cost, 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results.reduce((sum, r) => sum + r.latency, 0) / results.length).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">Mean response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Quality</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(Math.max(...results.map(r => r.quality)) * 100).toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">Highest F1 score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">All runs completed</p>
          </CardContent>
        </Card>
      </div>

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
    </div>
  );
};

export default Results;