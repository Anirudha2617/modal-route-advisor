import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown,
  Crown,
  Medal,
  Award,
  DollarSign,
  Clock,
  Target,
  Calendar
} from "lucide-react";
import { LeaderboardItem , leaderboardData } from "@/lib/api";

const Leaderboard = () => {
  const [data, setData] = React.useState<LeaderboardItem | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const result = await leaderboardData.getLeaderboard();
      setData(result);
    };
    fetchData();
  }, []);

  if (!data || !Array.isArray(data)) {
    return <div>No leaderboard data available.</div>;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-warning" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Award className="h-5 w-5 text-warning/70" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getTrendIcon = (trend: string) => {
    return trend === "up" ? 
      <TrendingUp className="h-4 w-4 text-success" /> : 
      <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Leaderboard</h1>
          <p className="text-muted-foreground">Weekly performance rankings based on cost-effectiveness and quality</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            This Week
          </Button>
          <Badge variant="outline">Updated 2h ago</Badge>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {data.slice(0, 3).map((item, index) => (
          <Card key={item.rank} className={`relative ${item.rank === 1 ? 'ring-2 ring-primary/20 bg-primary/5' : ''}`}>
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-2">
                {getRankIcon(item.rank)}
              </div>
              <CardTitle className="text-lg">{item.provider}</CardTitle>
              <CardDescription>{item.company}</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="text-2xl font-bold text-success">${item.avgCost}</div>
              <p className="text-xs text-muted-foreground">Avg cost per task</p>
              <div className="flex justify-center space-x-4 text-sm">
                <div>
                  <div className="font-medium">{(item.qualityScore * 100).toFixed(0)}%</div>
                  <div className="text-xs text-muted-foreground">Quality</div>
                </div>
                <div>
                  <div className="font-medium">{item.avgLatency}s</div>
                  <div className="text-xs text-muted-foreground">Latency</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
          <CardDescription>
            Comprehensive performance metrics across all tested providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4" />
                    <span>Avg Cost</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Latency</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>Quality</span>
                  </div>
                </TableHead>
                <TableHead>Cost Efficiency</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => (
                <TableRow key={item.rank} className={item.rank <= 3 ? 'bg-muted/20' : ''}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRankIcon(item.rank)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.provider}</TableCell>
                  <TableCell>{item.company}</TableCell>
                  <TableCell>
                    <div className="font-medium">${item.avgCost}</div>
                  </TableCell>
                  <TableCell>{item.avgLatency}s</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">{(item.qualityScore * 100).toFixed(0)}%</div>
                      {item.qualityScore >= 0.9 ? (
                        <Badge className="bg-success text-xs">Excellent</Badge>
                      ) : item.qualityScore >= 0.85 ? (
                        <Badge variant="secondary" className="text-xs">Good</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Fair</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{item.costEfficiency}</div>
                    <div className="text-xs text-muted-foreground">quality/cost</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(item.trend)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Methodology */}
      <Card>
        <CardHeader>
          <CardTitle>Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Ranking Criteria</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Cost efficiency (quality score ÷ average cost)</li>
                <li>• Latency performance across modalities</li>
                <li>• Quality scores from standardized tasks</li>
                <li>• Consistency across different content types</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Test Corpus</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 50 documents across various domains</li>
                <li>• Q&A, summarization, and extraction tasks</li>
                <li>• Text, image, audio, video modalities</li>
                <li>• Updated weekly with fresh content</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;