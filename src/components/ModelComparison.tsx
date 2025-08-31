import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Settings, Upload, FileText, Image, Mic, Video, AlertCircle } from "lucide-react";
import InteractiveChart from './InteractiveChart';
import ApiKeyManager from './ApiKeyManager';
import { useApiKeys } from '@/hooks/useApiKeys';
import { useModelComparison } from '@/hooks/useModelComparison';
import { ModelRequest } from '@/services/aiModelsApi';

const ModelComparison = () => {
  const { isConfigured, getMissingKeys, getAvailableProviders } = useApiKeys();
  const { results, loading, error, runComparison, clearResults } = useModelComparison();
  
  const [inputMethod, setInputMethod] = useState<'text' | 'image' | 'audio' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [fileContent, setFileContent] = useState<File | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [customParameters, setCustomParameters] = useState({
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
  });

  // Available models by provider
  const modelOptions = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    google: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro'],
    perplexity: ['llama-3.1-sonar-small-128k-online', 'llama-3.1-sonar-large-128k-online'],
    xai: ['grok-beta'],
  };

  // Get available models based on configured API keys
  const availableModels = React.useMemo(() => {
    const availableProviders = getAvailableProviders();
    const models: string[] = [];
    
    availableProviders.forEach(provider => {
      if (modelOptions[provider as keyof typeof modelOptions]) {
        models.push(...modelOptions[provider as keyof typeof modelOptions]);
      }
    });
    
    return models;
  }, [getAvailableProviders]);

  // Initialize selected models
  useEffect(() => {
    if (selectedModels.length === 0 && availableModels.length > 0) {
      setSelectedModels(availableModels.slice(0, 3)); // Select first 3 by default
    }
  }, [availableModels, selectedModels.length]);

  const handleModelToggle = (model: string, checked: boolean) => {
    if (checked) {
      setSelectedModels(prev => [...prev, model]);
    } else {
      setSelectedModels(prev => prev.filter(m => m !== model));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileContent(file);
    }
  };

  const getInputIcon = (method: string) => {
    switch (method) {
      case 'text': return <FileText className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Mic className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleRunComparison = async () => {
    if (!isConfigured()) {
      return;
    }

    const content = inputMethod === 'text' ? textContent : fileContent;
    if (!content) {
      return;
    }

    const request: ModelRequest = {
      inputMethod,
      content: content as string | File,
      model: selectedModels[0], // This will be overridden in batch comparison
      parameters: customParameters,
    };

    try {
      await runComparison(request, selectedModels);
    } catch (error) {
      console.error('Comparison failed:', error);
    }
  };

  const canRunComparison = isConfigured() && 
    selectedModels.length > 0 && 
    (inputMethod === 'text' ? textContent.trim() : fileContent);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            AI Model Comparison
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive multi-parameter analysis across different AI providers
          </p>
        </div>
        <div className="flex gap-2">
          <ApiKeyManager 
            showAsDialog={true}
            trigger={
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                API Keys
              </Button>
            }
          />
          {results.length > 0 && (
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </div>
      </div>

      {/* Configuration Status */}
      {!isConfigured() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please configure your API keys to start comparing models. Missing keys: {' '}
            {getMissingKeys().map(key => key.label).join(', ')}
          </AlertDescription>
        </Alert>
      )}

      {/* Input Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Input Configuration</CardTitle>
          <CardDescription>
            Configure your input data and select models for comparison
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(value) => setInputMethod(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                Image
              </TabsTrigger>
              <TabsTrigger value="audio" className="flex items-center gap-2">
                <Mic className="h-4 w-4" />
                Audio
              </TabsTrigger>
              <TabsTrigger value="video" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <div>
                <Label htmlFor="text-input">Text Input</Label>
                <Textarea
                  id="text-input"
                  placeholder="Enter your text for analysis..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[120px]"
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <div>
                <Label htmlFor="image-input">Image Upload</Label>
                <Input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                {fileContent && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {fileContent.name} ({(fileContent.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="audio" className="space-y-4">
              <div>
                <Label htmlFor="audio-input">Audio Upload</Label>
                <Input
                  id="audio-input"
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                />
                {fileContent && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {fileContent.name} ({(fileContent.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4">
              <div>
                <Label htmlFor="video-input">Video Upload</Label>
                <Input
                  id="video-input"
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                />
                {fileContent && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected: {fileContent.name} ({(fileContent.size / 1024 / 1024).toFixed(1)} MB)
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Model Selection */}
          <div className="space-y-3">
            <Label>Select Models to Compare</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableModels.map((model) => (
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
                    <Badge variant="outline">{model}</Badge>
                  </label>
                </div>
              ))}
            </div>
            {availableModels.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No models available. Please configure your API keys.
              </p>
            )}
          </div>

          {/* Advanced Parameters */}
          <div className="space-y-4">
            <Label>Advanced Parameters</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="temperature">Temperature: {customParameters.temperature}</Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={customParameters.temperature}
                  onChange={(e) => setCustomParameters(prev => ({ 
                    ...prev, 
                    temperature: parseFloat(e.target.value) 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  value={customParameters.maxTokens}
                  onChange={(e) => setCustomParameters(prev => ({ 
                    ...prev, 
                    maxTokens: parseInt(e.target.value) || 1000 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="topP">Top P: {customParameters.topP}</Label>
                <Input
                  id="topP"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={customParameters.topP}
                  onChange={(e) => setCustomParameters(prev => ({ 
                    ...prev, 
                    topP: parseFloat(e.target.value) 
                  }))}
                />
              </div>
            </div>
          </div>

          {/* Run Comparison Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleRunComparison}
              disabled={!canRunComparison || loading}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Running Comparison...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Comparison
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading Progress */}
      {loading && (
        <Card>
          <CardContent className="py-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing models...</span>
                <span>{selectedModels.length} models</span>
              </div>
              <Progress value={50} className="w-full" />
              <p className="text-xs text-muted-foreground text-center">
                This may take a few moments depending on the number of models selected
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results */}
      {results.length > 0 && (
        <InteractiveChart 
          data={results}
          title="AI Model Performance Comparison"
        />
      )}

      {/* Research Attribution */}
      <Card className="bg-gradient-to-r from-muted/50 to-muted/30">
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              This comparison tool is powered by ModalRoute Research Platform
            </p>
            <p className="text-lg font-semibold text-primary">
              "Multimodal Tokenization Cost Analysis: Finding the Optimal Route for AI Processing"
            </p>
            <p className="text-sm text-muted-foreground">
              Research Team, AI Conference 2024
            </p>
            <Button variant="outline" size="sm">
              Cite This Work
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelComparison;