// src/app/new-experiment/page.tsx or src/components/NewExperiment.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
  AlertCircle,
  BarChart,
  Loader2,
  Undo2,
} from "lucide-react";

import {
  fetchModels,
  runExperiment,
  BackendAIModel,
  UserData,
  AppContext,
  ExperimentResults,
  ExperimentPayload,
} from "@/lib/api";
import ExperimentResultsTable from "@/components/ExperimentResultsTable";



// Define initial state for data and context
interface ExperimentDataState {
  data: UserData;
  context: AppContext;
  models: number[]; // Store model IDs
}

const initialExperimentData: ExperimentDataState = {
  data: {
    img: null,
    audio: null,
    vid: null,
    text: "",
    doc: null,
  },
  context: {
    text: [],
    tasks: [],
    qaQuestions: "",
  },
  models: [],
};



const NewExperiment = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [experimentData, setExperimentData] = useState<ExperimentDataState>(initialExperimentData);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [allBackendModels, setAllBackendModels] = useState<BackendAIModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingExperiment, setLoadingExperiment] = useState(false);
  const [experimentResults, setExperimentResults] = useState<any[] | null>(null); // Use any[] for the nested structure
  const [qaQuestions, setQaQuestions] = useState("");
  const [experimentError, setExperimentError] = useState<string | null>(null);
  
  const tasks = [
    { id: "qa", name: "Q&A Extraction", description: "Extract answers to specific questions" },
    { id: "summarization", name: "Summarization", description: "Generate concise summaries" },
    { id: "table", name: "Table Extraction", description: "Extract structured data from tables" }
  ];

  // Helper to update specific data field
  const updateData = useCallback((key: keyof UserData, value: string | File | null) => {
    setExperimentData(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [key]: value,
      },
    }));
  }, []);

  // Handle file input changes
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>, type: keyof UserData) => {
    if (event.target.files && event.target.files.length > 0) {
      updateData(type, event.target.files[0]);
    } else {
      updateData(type, null);
    }
  }, [updateData]);

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const toggleModelSelection = useCallback((modelId: number) => {
    setExperimentData(prev => ({
      ...prev,
      models: prev.models.includes(modelId)
        ? prev.models.filter(id => id !== modelId)
        : [...prev.models, modelId],
    }));
  }, []);

  // Fetch models when entering Step 3
  useEffect(() => {
    if (activeStep === 3 && allBackendModels.length === 0 && !loadingModels) {
      setLoadingModels(true);
      fetchModels().then(models => {
        const modelsWithProviderNames = models.map(model => ({
          ...model,
          provider_name: `Provider ${model.provider}`
        }));
        setAllBackendModels(modelsWithProviderNames);
        setLoadingModels(false);
      }).catch(error => {
        console.error("Failed to fetch models:", error);
        setLoadingModels(false);
      });
    }
  }, [activeStep, allBackendModels.length, loadingModels]);

  const handleLaunchExperiment = async () => {
    setLoadingExperiment(true);
    setExperimentError(null);

    const payload: ExperimentPayload = {
      data: experimentData.data,
      context: {
        tasks: selectedTasks,
        qaQuestions: qaQuestions,
        text: experimentData.data.text ? experimentData.data.text.split('\n').filter(line => line.trim() !== '') : [],
      },
      models: experimentData.models,
    };

    console.log("Launching experiment with payload:", payload);
    try {
      const results = await runExperiment(payload);
      if (results) {
        setExperimentResults(results);
        setActiveStep(5);
      } else {
        setExperimentError("Failed to get results from the experiment. Please try again.");
      }
    } catch (error: any) {
      console.error("Error during experiment launch:", error);
      setExperimentError(`Failed to launch experiment: ${error.message || "Unknown error"}`);
    } finally {
      setLoadingExperiment(false);
    }
  };

  // Determine if a model is selected
  const isModelSelected = (modelId: number) => experimentData.models.includes(modelId);

  // Check if any content is uploaded/entered in Step 1
  const isContentProvided =
    !!experimentData.data.text ||
    !!experimentData.data.img ||
    !!experimentData.data.audio ||
    !!experimentData.data.vid ||
    !!experimentData.data.doc;

  const handleReset = () => {
    setActiveStep(1);
    setExperimentData(initialExperimentData);
    setSelectedTasks([]);
    setExperimentResults(null);
    setQaQuestions("");
    setExperimentError(null);
  };

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      {/* Progress Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Try It Yourself
        </h1>
        <p className="text-muted-foreground text-lg">
          Reproduce our research findings by uploading your own content and comparing costs
        </p>
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 rounded-lg border border-blue-600/20">
          <p className="text-sm text-muted-foreground">
            📄 Upload documents, images, or audio → 🔄 Auto-generate modality variants →
            📊 See real-time cost/quality analysis → 📈 Export results for citation
          </p>
        </div>
        <div className="space-y-2">
          <Badge variant="outline">Step {activeStep} of 5</Badge>
          <Progress value={(activeStep / 5) * 100} className="w-full max-w-md mx-auto" />
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
                  value={experimentData.data.text}
                  onChange={(e) => updateData("text", e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <Label>Or Upload Files</Label>
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
                  <div className="grid grid-cols-1 gap-2 mt-4 text-left">
                    <div>
                      <Label htmlFor="upload-doc" className="text-sm">Document (PDF, DOC, TXT)</Label>
                      <Input id="upload-doc" type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => handleFileChange(e, "doc")} className="mt-1" />
                      {experimentData.data.doc && <Badge variant="secondary" className="mt-1">{experimentData.data.doc instanceof File ? experimentData.data.doc.name : 'Uploaded'}</Badge>}
                    </div>
                    <div>
                      <Label htmlFor="upload-img" className="text-sm">Image (JPG, PNG)</Label>
                      <Input id="upload-img" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "img")} className="mt-1" />
                      {experimentData.data.img && <Badge variant="secondary" className="mt-1">{experimentData.data.img instanceof File ? experimentData.data.img.name : 'Uploaded'}</Badge>}
                    </div>
                    <div>
                      <Label htmlFor="upload-audio" className="text-sm">Audio (MP3)</Label>
                      <Input id="upload-audio" type="file" accept="audio/*" onChange={(e) => handleFileChange(e, "audio")} className="mt-1" />
                      {experimentData.data.audio && <Badge variant="secondary" className="mt-1">{experimentData.data.audio instanceof File ? experimentData.data.audio.name : 'Uploaded'}</Badge>}
                    </div>
                    <div>
                      <Label htmlFor="upload-video" className="text-sm">Video (MP4)</Label>
                      <Input id="upload-video" type="file" accept="video/*" onChange={(e) => handleFileChange(e, "vid")} className="mt-1" />
                      {experimentData.data.vid && <Badge variant="secondary" className="mt-1">{experimentData.data.vid instanceof File ? experimentData.data.vid.name : 'Uploaded'}</Badge>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setActiveStep(2)} disabled={!isContentProvided}>
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
                    <Label htmlFor="questions" className="text-sm">Questions to ask (one per line)</Label>
                    <Textarea
                      id="questions"
                      placeholder="Enter one question per line..."
                      className="mt-1"
                      value={qaQuestions}
                      onChange={(e) => setQaQuestions(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(1)}>
                <Undo2 className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setActiveStep(3)} disabled={selectedTasks.length === 0}>
                Continue to Models
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Select Providers & Models */}
      {activeStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Select AI Models</CardTitle>
            <CardDescription>
              Choose which models to compare. Each will be tested with all supported modalities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingModels ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                <span>Loading models from backend...</span>
              </div>
            ) : allBackendModels.length === 0 ? (
              <div className="text-center text-red-500 p-8">
                <AlertCircle className="inline-block mr-2 h-5 w-5" /> No models available from the backend. Please check API.
              </div>
            ) : (
              <div className="grid gap-4">
                {allBackendModels.map((model) => (
                  <div key={model.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`model-${model.id}`}
                        checked={isModelSelected(model.id)}
                        onCheckedChange={() => toggleModelSelection(model.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={`model-${model.id}`} className="font-medium cursor-pointer">
                              {model.name}
                            </Label>
                            {model.provider_name && <Badge variant="outline">{model.provider_name}</Badge>}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {model.supported_modalities.types.map((type) => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>Text Cost: {model.cost_per_token_text ? `$${parseFloat(model.cost_per_token_text).toFixed(6)} per token` : 'N/A'}</p>
                          <p>Image Cost: {model.cost_per_token_image ? `$${parseFloat(model.cost_per_token_image).toFixed(6)} per token` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(2)}>
                <Undo2 className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={() => setActiveStep(4)} disabled={experimentData.models.length === 0}>
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
              Review your experiment configuration and estimated runs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {experimentError && (
              <div className="border border-red-400 bg-red-50 dark:bg-red-950 p-4 rounded-lg text-red-700 dark:text-red-300 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <h4 className="font-medium">Error during launch!</h4>
                  <p className="text-sm">{experimentError}</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2">Selected Tasks</h4>
                <div className="space-y-1">
                  {selectedTasks.length > 0 ? selectedTasks.map(taskId => {
                    const task = tasks.find(t => t.id === taskId);
                    return (
                      <Badge key={taskId} variant="outline" className="mr-1 mb-1">
                        {task?.name}
                      </Badge>
                    );
                  }) : <p className="text-muted-foreground text-sm">No tasks selected.</p>}
                  {selectedTasks.includes("qa") && qaQuestions && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-semibold">Questions:</span> {qaQuestions.split('\n').filter(q => q.trim() !== '').length}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Selected Models</h4>
                <div className="space-y-1">
                  {experimentData.models.length > 0 ? experimentData.models.map(modelId => {
                    const model = allBackendModels.find(m => m.id === modelId);
                    return (
                      <Badge key={modelId} variant="outline" className="mr-1 mb-1">
                        {model?.name} ({model?.provider_name})
                      </Badge>
                    );
                  }) : <p className="text-muted-foreground text-sm">No models selected.</p>}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Estimated Runs</h4>
                <div className="text-2xl font-bold text-primary">
                  {selectedTasks.length * experimentData.models.reduce((acc, modelId) => {
                    const model = allBackendModels.find(m => m.id === modelId);
                    const supportedModalitiesCount = model?.supported_modalities?.types?.length || 0;
                    return acc + supportedModalitiesCount;
                  }, 0)}
                </div>
                <p className="text-sm text-muted-foreground">total API calls</p>
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Input Content</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {experimentData.data.text && <p>Text: Yes ({experimentData.data.text.length} chars)</p>}
                    {experimentData.data.doc && <p>Document: Yes ({experimentData.data.doc instanceof File ? experimentData.data.doc.name : 'Uploaded'})</p>}
                    {experimentData.data.img && <p>Image: Yes ({experimentData.data.img instanceof File ? experimentData.data.img.name : 'Uploaded'})</p>}
                    {experimentData.data.audio && <p>Audio: Yes ({experimentData.data.audio instanceof File ? experimentData.data.audio.name : 'Uploaded'})</p>}
                    {experimentData.data.vid && <p>Video: Yes ({experimentData.data.vid instanceof File ? experimentData.data.vid.name : 'Uploaded'})</p>}
                    {!isContentProvided && (
                      <p>No content uploaded.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Cost Estimate (Placeholder)</h4>
                  <p className="text-sm text-muted-foreground">
                    Actual cost calculation would happen here based on content size and selected models' pricing. This is a placeholder for now.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(3)}>
                <Undo2 className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleLaunchExperiment} disabled={loadingExperiment}>
                {loadingExperiment ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                {loadingExperiment ? "Launching..." : "Launch Experiment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: View Results */}
      {activeStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart className="h-5 w-5" />
              <span>Experiment Results</span>
            </CardTitle>
            <CardDescription>
              Here are the detailed results from your experiment, comparing performance, tokens used, and cost across the selected models and modalities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {experimentResults && experimentResults.length > 0 ? (
                experimentResults.map(taskResult => {
                    const task = tasks.find(t => t.id === taskResult.task_id);
                    const taskName = task ? task.name : `Task ID: ${taskResult.task_id}`;
                    return (
                        <div key={taskResult.task_id}>
                            <h3 className="text-xl font-semibold mb-4">{taskName}</h3>
                            <ExperimentResultsTable results={taskResult.results} />
                        </div>
                    );
                })
             ) : (
                <div className="text-center text-muted-foreground py-8">
                    No results to display.
                </div>
             )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setActiveStep(4)}>
                <Undo2 className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleReset}>
                Start New Experiment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewExperiment;