import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, ExternalLink, FileText, Users, Calendar } from "lucide-react";

const ResearchPaper = () => {
  const sections = [
    { id: "abstract", title: "Abstract", href: "#abstract" },
    { id: "introduction", title: "Introduction", href: "#introduction" },
    { id: "methodology", title: "Methodology", href: "#methodology" },
    { id: "results", title: "Results", href: "#results" },
    { id: "discussion", title: "Discussion", href: "#discussion" },
    { id: "conclusion", title: "Conclusion", href: "#conclusion" },
    { id: "references", title: "References", href: "#references" }
  ];

  return (
    <div className="space-y-8">
      {/* Paper Header */}
      <Card className="bg-gradient-to-r from-tech-blue/5 to-tech-purple/5 border-tech-blue/20">
        <CardHeader className="text-center space-y-6">
          <div className="space-y-4">
            <Badge className="bg-tech-blue text-white">Research Paper</Badge>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
              Multimodal Tokenization Cost Analysis: Finding the Optimal Route for AI Processing
            </CardTitle>
            <div className="flex items-center justify-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Research Team</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>2024</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>AI Conference 2024</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button className="bg-gradient-to-r from-tech-blue to-tech-purple">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on ArXiv
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={section.href}
                    className="block p-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Paper Content */}
        <div className="lg:col-span-3 space-y-8">
          {/* Abstract */}
          <Card id="abstract">
            <CardHeader>
              <CardTitle className="text-xl text-tech-blue">Abstract</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                Modern AI applications increasingly rely on multimodal inputs (text, images, audio, video) for various tasks. 
                However, the cost implications of processing different modalities across various AI providers remain poorly understood. 
                This paper presents ModalRoute, a comprehensive benchmarking framework that analyzes tokenization costs, processing 
                latency, and task accuracy across major AI providers (OpenAI, Anthropic, Google) for identical semantic content 
                presented in different modalities.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We systematically converted 1,000 documents into text, image, audio, and video formats, then evaluated performance 
                across extraction, summarization, and table capture tasks. Our findings reveal significant cost variations: 
                image processing can be up to 340% more expensive than text for equivalent tasks, while maintaining 92-98% accuracy. 
                We introduce a cost-optimization algorithm that recommends the most economical modality route while preserving 
                task quality within acceptable thresholds.
              </p>
            </CardContent>
          </Card>

          {/* Introduction */}
          <Card id="introduction">
            <CardHeader>
              <CardTitle className="text-xl text-tech-blue">1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
              <p className="text-muted-foreground leading-relaxed">
                The proliferation of multimodal AI systems has created new opportunities for processing diverse content types. 
                However, practitioners face a critical decision: which modality provides the best cost-to-performance ratio for 
                their specific use case? This question becomes increasingly important as organizations scale their AI implementations 
                and seek to optimize operational costs.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Traditional benchmarks focus on model accuracy without considering the economic implications of different input 
                modalities. Our research addresses this gap by providing a systematic framework for evaluating the cost-effectiveness 
                of multimodal AI processing across leading providers.
              </p>
            </CardContent>
          </Card>

          {/* Methodology */}
          <Card id="methodology">
            <CardHeader>
              <CardTitle className="text-xl text-tech-blue">2. Methodology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-tech-purple">Dataset Preparation</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 1,000 documents across 10 domains</li>
                    <li>• Text extraction and normalization</li>
                    <li>• PDF rendering at multiple DPIs</li>
                    <li>• TTS audio generation (multiple voices)</li>
                    <li>• Video slide generation with narration</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-tech-purple">Evaluation Tasks</h4>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• Extraction QA (5 questions per document)</li>
                    <li>• Summarization (3 bullet points + risks)</li>
                    <li>• Table capture (JSON schema extraction)</li>
                    <li>• Quality scoring with gold standard</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card id="results">
            <CardHeader>
              <CardTitle className="text-xl text-tech-blue">3. Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-success/10 to-success/5 p-6 rounded-lg border border-success/20">
                <h4 className="font-semibold text-success mb-4">Key Findings</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">340%</div>
                    <div className="text-muted-foreground">Max cost difference</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">92-98%</div>
                    <div className="text-muted-foreground">Accuracy retention</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">45%</div>
                    <div className="text-muted-foreground">Avg cost savings</div>
                  </div>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed">
                Our analysis reveals systematic patterns in cost-effectiveness across modalities. Text processing consistently 
                offers the lowest cost per token, while image processing provides better accuracy for visually complex documents. 
                The optimal modality choice depends on the specific task requirements and acceptable accuracy thresholds.
              </p>
            </CardContent>
          </Card>

          {/* Citation */}
          <Card className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800 border-neutral-200 dark:border-neutral-700">
            <CardHeader>
              <CardTitle className="text-lg">Cite This Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background p-4 rounded-lg border font-mono text-sm">
                <pre className="whitespace-pre-wrap text-muted-foreground">
{`@inproceedings{modalroute2024,
  title={Multimodal Tokenization Cost Analysis: Finding the Optimal Route for AI Processing},
  author={Research Team},
  booktitle={AI Conference 2024},
  year={2024},
  url={https://modalroute-playground.com}
}`}
                </pre>
              </div>
              <Button className="mt-4" variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Copy BibTeX
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResearchPaper;