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
  Zap,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import heroDashboard from "@/assets/hero-dashboard.jpg";

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
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tech-blue via-tech-purple to-tech-blue p-8 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold">
              ModalRoute
              <span className="block text-2xl font-normal opacity-90">
                Multimodal AI Cost Research Platform
              </span>
            </h1>
            <p className="text-lg opacity-90 leading-relaxed">
              Companion website for our research on multimodal tokenization cost analysis. 
              Explore interactive results, reproduce experiments, and discover the most 
              cost-effective AI processing routes.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-white text-tech-blue hover:bg-white/90" asChild>
                <Link to="/new">
                  Try It Yourself
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link to="/paper">
                  Read Paper
                </Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <img 
              src={heroDashboard} 
              alt="ModalRoute Research Platform" 
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Research Summary */}
      <section className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
            About This Research
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            Understanding the cost-performance trade-offs in multimodal AI processing
          </p>
        </div>

        <Card className="bg-gradient-to-r from-tech-blue/5 to-tech-purple/5 border-tech-blue/20">
          <CardContent className="p-8 space-y-6">
            <div className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Modern AI applications increasingly rely on multimodal inputs (text, images, audio, video) for various tasks. 
                However, the cost implications of processing different modalities across various AI providers remain poorly understood. 
                This research presents a comprehensive benchmarking framework that analyzes tokenization costs, processing latency, 
                and task accuracy across major AI providers for identical semantic content presented in different modalities.
              </p>
              
              <p className="text-muted-foreground leading-relaxed">
                We systematically converted 1,000 documents into multiple formats and evaluated performance across extraction, 
                summarization, and table capture tasks. Our findings reveal that image processing can be up to 340% more expensive 
                than text for equivalent tasks, while maintaining 92-98% accuracy. We introduce a cost-optimization algorithm that 
                recommends the most economical modality route while preserving task quality within acceptable thresholds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-tech-blue/20">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-tech-blue">1,000</div>
                <div className="text-sm text-muted-foreground">Documents Analyzed</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-tech-purple">4</div>
                <div className="text-sm text-muted-foreground">Modalities Tested</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-success">340%</div>
                <div className="text-sm text-muted-foreground">Max Cost Difference</div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-6">
              <Button className="bg-gradient-to-r from-tech-blue to-tech-purple">
                <FileText className="mr-2 h-4 w-4" />
                Download Paper
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Dataset
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

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