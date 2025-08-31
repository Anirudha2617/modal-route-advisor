import { useState, useCallback } from 'react';
import { 
  ModelRequest, 
  ModelResponse, 
  batchCompareModels, 
  callChatGPT, 
  callClaude, 
  callGemini, 
  callPerplexity, 
  callGrok 
} from '@/services/aiModelsApi';
import { useToast } from '@/hooks/use-toast';

export interface ComparisonState {
  results: ModelResponse[];
  loading: boolean;
  error: string | null;
}

export const useModelComparison = () => {
  const [state, setState] = useState<ComparisonState>({
    results: [],
    loading: false,
    error: null,
  });
  
  const { toast } = useToast();

  const runComparison = useCallback(async (
    request: ModelRequest,
    selectedModels: string[]
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const results = await batchCompareModels(request, selectedModels);
      
      setState({
        results,
        loading: false,
        error: null,
      });
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      if (successCount > 0) {
        toast({
          title: "Comparison Complete",
          description: `Successfully compared ${successCount} models${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
        });
      }
      
      if (errorCount === results.length) {
        toast({
          title: "Comparison Failed",
          description: "All model requests failed. Please check your API keys and try again.",
          variant: "destructive",
        });
      }
      
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState({
        results: [],
        loading: false,
        error: errorMessage,
      });
      
      toast({
        title: "Comparison Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  const runSingleModel = useCallback(async (
    request: ModelRequest
  ): Promise<ModelResponse> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      let result: ModelResponse;
      
      // Determine which API to call based on model name
      if (request.model.includes('gpt') || request.model.includes('chatgpt')) {
        result = await callChatGPT(request);
      } else if (request.model.includes('claude')) {
        result = await callClaude(request);
      } else if (request.model.includes('gemini')) {
        result = await callGemini(request);
      } else if (request.model.includes('perplexity') || request.model.includes('llama')) {
        result = await callPerplexity(request);
      } else if (request.model.includes('grok')) {
        result = await callGrok(request);
      } else {
        throw new Error(`Unknown model: ${request.model}`);
      }
      
      setState(prev => ({
        results: [...prev.results, result],
        loading: false,
        error: null,
      }));
      
      if (result.status === 'success') {
        toast({
          title: "Model Test Complete",
          description: `Successfully tested ${result.model}`,
        });
      } else {
        toast({
          title: "Model Test Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive",
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      toast({
        title: "Model Test Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [toast]);

  const clearResults = useCallback(() => {
    setState({
      results: [],
      loading: false,
      error: null,
    });
  }, []);

  const addResult = useCallback((result: ModelResponse) => {
    setState(prev => ({
      ...prev,
      results: [...prev.results, result],
    }));
  }, []);

  const removeResult = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    ...state,
    runComparison,
    runSingleModel,
    clearResults,
    addResult,
    removeResult,
  };
};