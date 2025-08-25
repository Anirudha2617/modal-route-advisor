import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Image, 
  Mic, 
  Video,
  Settings2,
  Play,
  AlertCircle
} from "lucide-react";

const NewExperiment = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const providers = [
    { id: "openai", name: "OpenAI", models: ["GPT-4o", "GPT-4o-mini"], cost: "$$", supported: ["text", "image", "audio"] },
    { id: "anthropic", name: "Anthropic", models: ["Claude-3.5-Sonnet", "Claude-3-Haiku"], cost: "$", supported: ["text", "image"] },
    { id: "google", name: "Google", models: ["Gemini-1.5-Pro", "Gemini-1.5-Flash"], cost: "$", supported: ["text", "image", "audio", "video"] },
    { id: "xai", name: "xAI", models: ["Grok-Beta"], cost: "$$$", supported: ["text", "image"] }
  ];

  const tasks = [
    { id: "qa", name: "Q&A Extraction", description: "Extract answers to specific questions" },
    { id: "summarization", name: "Summarization", description: "Generate concise summaries" },
    { id: "table", name: "Table Extraction", description: "Extract structured data from tables" }
  ];

  const toggleProvider = (providerId: string) => {
    setSelectedProviders(prev => 
      prev.includes(providerId) 
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-tech-blue to-tech-purple bg-clip-text text-transparent">
          Try It Yourself
        </h1>
        <p className="text-muted-foreground text-lg">
          Reproduce our research findings by uploading your own content and comparing costs
        </p>
        <div className="bg-gradient-to-r from-tech-blue/10 to-tech-purple/10 p-4 rounded-lg border border-tech-blue/20">
          <p className="text-sm text-muted-foreground">
            📄 Upload documents, images, or audio → 🔄 Auto-generate modality variants → 
            📊 See real-time cost/quality analysis → 📈 Export results for citation
          </p>
        </div>
        <div className="space-y-2">
          <Badge variant="outline">Step {activeStep} of 4</Badge>
          <Progress value={(activeStep / 4) * 100} className="w-full max-w-md mx-auto" />
        </div>
      </div>

      {/* Step 1: Upload Content */}
      {activeStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="h-5 w-5" />
              <span>Upload Source Content</span>
            </CardTitle>
            <CardDescription>
              Choose your input format. We'll generate variants for all other modalities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label htmlFor="text-input">Paste Text Content</Label>
                <Textarea 
                  id="text-input"
                  placeholder="Enter your text content here..."
                  className="min-h-[200px]"
                />
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Use Text Input
                </Button>
              </div>
              
              <div className="space-y-4">
                <Label>Or Upload File</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center space-y-4">
                  <div className="flex justify-center space-x-4">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <Mic className="h-8 w-8 text-muted-foreground" />
                    <Video className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Drop files here or click to browse</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, TXT, JPG, PNG, MP3, MP4 supported</p>
                  </div>
                  <Button variant="outline">
                    Choose Files
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setActiveStep(2)}>
                Continue to Tasks
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Tasks */}
      {activeStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings2 className="h-5 w-5" />
              <span>Select Tasks</span>
            </CardTitle>
            <CardDescription>
              Choose the evaluation tasks you want to run across all modalities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                  <Checkbox 
                    id={task.id}
                    checked={selectedTasks.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                  />
                  <div className="space-y-1 flex-1">
                    <Label htmlFor={task.id} className="text-sm font-medium cursor-pointer">
                      {task.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedTasks.includes("qa") && (
              <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Q&A Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="questions" className="text-sm">Questions to ask</Label>
                    <Textarea 
                      id="questions"
                      placeholder="Enter one question per line..."
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(1)}>
                Back
              </Button>
              <Button onClick={() => setActiveStep(3)} disabled={selectedTasks.length === 0}>
                Continue to Providers
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Providers */}
      {activeStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select AI Providers</CardTitle>
            <CardDescription>
              Choose which providers and models to compare. Each will be tested with all supported modalities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              {providers.map((provider) => (
                <div key={provider.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id={provider.id}
                      checked={selectedProviders.includes(provider.id)}
                      onCheckedChange={() => toggleProvider(provider.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={provider.id} className="font-medium cursor-pointer">
                            {provider.name}
                          </Label>
                          <Badge variant="outline">{provider.cost}</Badge>
                        </div>
                        <div className="flex space-x-1">
                          {provider.supported.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {provider.models.map((model) => (
                          <span key={model} className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(2)}>
                Back
              </Button>
              <Button onClick={() => setActiveStep(4)} disabled={selectedProviders.length === 0}>
                Review & Launch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Launch */}
      {activeStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Review & Launch</span>
            </CardTitle>
            <CardDescription>
              Review your experiment configuration and estimated costs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Selected Tasks</h4>
                <div className="space-y-1">
                  {selectedTasks.map(taskId => {
                    const task = tasks.find(t => t.id === taskId);
                    return (
                      <Badge key={taskId} variant="outline">
                        {task?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Selected Providers</h4>
                <div className="space-y-1">
                  {selectedProviders.map(providerId => {
                    const provider = providers.find(p => p.id === providerId);
                    return (
                      <Badge key={providerId} variant="outline">
                        {provider?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Estimated Runs</h4>
                <div className="text-2xl font-bold text-primary">
                  {selectedTasks.length * selectedProviders.reduce((acc, pid) => {
                    const provider = providers.find(p => p.id === pid);
                    return acc + (provider?.supported.length || 0);
                  }, 0)}
                </div>
                <p className="text-sm text-muted-foreground">total API calls</p>
              </div>
            </div>

            <div className="border border-warning/20 bg-warning/5 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
                <div>
                  <h4 className="font-medium text-warning">Cost Estimate</h4>
                  <p className="text-sm text-muted-foreground">
                    Expected cost: <span className="font-medium">$12.50 - $18.75</span> depending on content length and provider usage.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(3)}>
                Back
              </Button>
              <Button className="bg-gradient-primary hover:shadow-primary">
                <Play className="mr-2 h-4 w-4" />
                Launch Experiment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewExperiment;