import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Image, 
  Mic, 
  Video,
  DollarSign,
  Clock,
  TrendingUp,
  ArrowRight,
  Zap
} from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dashboard.jpg";

const Dashboard = () => {
  const recentRuns = [
    {
      id: 1,
      document: "Product Requirements Doc",
      modalities: 4,
      providers: 3,
      cost: 2.45,
      status: "completed",
      savings: 23.5
    },
    {
      id: 2,
      document: "Financial Report Q3",
      modalities: 3,
      providers: 2,
      cost: 1.89,
      status: "running",
      savings: 0
    },
    {
      id: 3,
      document: "User Interview Transcripts",
      modalities: 2,
      providers: 4,
      cost: 3.21,
      status: "completed",
      savings: 41.2
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-hero border border-border">
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/20"></div>
        <div className="relative flex items-center justify-between p-8 lg:p-12">
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Compare AI costs across 
              <span className="bg-gradient-primary bg-clip-text text-transparent"> modalities</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Upload content once, test across text, image, audio, and video modalities. 
              Find the cheapest viable route with quality guarantees.
            </p>
            <div className="flex items-center space-x-4">
            <Button size="lg" className="bg-gradient-primary hover:shadow-primary" asChild>
              <Link to="/new">
                <Upload className="mr-2 h-5 w-5" />
                Start New Experiment
              </Link>
            </Button>
              <Button variant="outline" size="lg">
                View Leaderboard
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <img 
              src={heroImage} 
              alt="ModalRoute Dashboard" 
              className="w-96 h-64 object-cover rounded-lg shadow-glow"
            />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Experiments</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">147</div>
            <p className="text-xs text-muted-foreground">+12 from last week</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">$1,247</div>
            <p className="text-xs text-muted-foreground">32% reduction this month</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground">-0.4s improvement</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.7%</div>
            <p className="text-xs text-muted-foreground">+2.1% this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Experiments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Experiments</CardTitle>
            <CardDescription>
              Your latest multimodal cost comparisons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{run.document}</h4>
                    <Badge variant={run.status === "completed" ? "default" : "secondary"}>
                      {run.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{run.modalities} modalities</span>
                    <span>{run.providers} providers</span>
                    <span className="font-medium text-foreground">${run.cost}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {run.savings > 0 && (
                    <div className="text-right">
                      <div className="text-sm font-medium text-success">
                        {run.savings}% saved
                      </div>
                      <div className="text-xs text-muted-foreground">vs baseline</div>
                    </div>
                  )}
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Choose your input modality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              Upload Text Document
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Image className="mr-2 h-4 w-4" />
              Upload PDF/Image
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Mic className="mr-2 h-4 w-4" />
              Upload Audio File
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Video className="mr-2 h-4 w-4" />
              Upload Video File
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;