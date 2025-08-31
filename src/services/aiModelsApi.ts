// Central API service for all AI model integrations
// Configure BASE_URL for your Django backend when ready
const BASE_URL = 'http://localhost:8000/api'; // Change to your Django backend URL

export interface ModelRequest {
  inputMethod: 'text' | 'image' | 'audio' | 'video';
  content: string | File;
  model: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}

export interface ModelResponse {
  model: string;
  inputMethod: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  processingTime: number; // in milliseconds
  performance: {
    accuracy?: number;
    f1Score?: number;
    rougeScore?: number;
  };
  response: string;
  timestamp: string;
  status: 'success' | 'error';
  error?: string;
}

export interface ChartData {
  inputMethod: string;
  models: {
    [modelName: string]: {
      cost: number;
      processingTime: number;
      performance: number;
    };
  };
}

// API Keys management (stored in localStorage for frontend-only approach)
export const getApiKey = (provider: string): string | null => {
  return localStorage.getItem(`apiKey_${provider}`);
};

export const setApiKey = (provider: string, apiKey: string): void => {
  localStorage.setItem(`apiKey_${provider}`, apiKey);
};

// OpenAI ChatGPT API
export const callChatGPT = async (request: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('openai');
  if (!apiKey) throw new Error('OpenAI API key not found');

  const startTime = Date.now();
  
  try {
    // Expected incoming data from OpenAI API:
    // {
    //   "id": "chatcmpl-xxx",
    //   "object": "chat.completion",
    //   "created": 1677652288,
    //   "model": "gpt-4",
    //   "choices": [
    //     {
    //       "index": 0,
    //       "message": {
    //         "role": "assistant",
    //         "content": "Response text here"
    //       },
    //       "finish_reason": "stop"
    //     }
    //   ],
    //   "usage": {
    //     "prompt_tokens": 9,
    //     "completion_tokens": 12,
    //     "total_tokens": 21
    //   }
    // }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4',
        messages: [
          {
            role: 'user',
            content: typeof request.content === 'string' ? request.content : 'Image analysis request'
          }
        ],
        temperature: request.parameters?.temperature || 0.7,
        max_tokens: request.parameters?.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      model: request.model || 'gpt-4',
      inputMethod: request.inputMethod,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: calculateCost('openai', data.usage?.total_tokens || 0),
      processingTime,
      performance: {
        accuracy: Math.random() * 0.1 + 0.9, // Mock performance data
      },
      response: data.choices[0]?.message?.content || '',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  } catch (error) {
    return {
      model: request.model || 'gpt-4',
      inputMethod: request.inputMethod,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      performance: {},
      response: '',
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Anthropic Claude API
export const callClaude = async (request: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('anthropic');
  if (!apiKey) throw new Error('Anthropic API key not found');

  const startTime = Date.now();
  
  try {
    // Expected incoming data from Anthropic API:
    // {
    //   "content": [
    //     {
    //       "text": "Response text here",
    //       "type": "text"
    //     }
    //   ],
    //   "id": "msg_xxx",
    //   "model": "claude-3-sonnet-20240229",
    //   "role": "assistant",
    //   "stop_reason": "end_turn",
    //   "stop_sequence": null,
    //   "type": "message",
    //   "usage": {
    //     "input_tokens": 10,
    //     "output_tokens": 25
    //   }
    // }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-sonnet-20240229',
        max_tokens: request.parameters?.maxTokens || 1000,
        messages: [
          {
            role: 'user',
            content: typeof request.content === 'string' ? request.content : 'Analyze this content'
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      model: request.model || 'claude-3-sonnet-20240229',
      inputMethod: request.inputMethod,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      cost: calculateCost('anthropic', (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)),
      processingTime,
      performance: {
        accuracy: Math.random() * 0.1 + 0.9,
      },
      response: data.content[0]?.text || '',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  } catch (error) {
    return {
      model: request.model || 'claude-3-sonnet-20240229',
      inputMethod: request.inputMethod,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      performance: {},
      response: '',
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Google Gemini API
export const callGemini = async (request: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('google');
  if (!apiKey) throw new Error('Google API key not found');

  const startTime = Date.now();
  
  try {
    // Expected incoming data from Google Gemini API:
    // {
    //   "candidates": [
    //     {
    //       "content": {
    //         "parts": [
    //           {
    //             "text": "Response text here"
    //           }
    //         ],
    //         "role": "model"
    //       },
    //       "finishReason": "STOP",
    //       "index": 0,
    //       "safetyRatings": [...]
    //     }
    //   ],
    //   "usageMetadata": {
    //     "promptTokenCount": 5,
    //     "candidatesTokenCount": 20,
    //     "totalTokenCount": 25
    //   }
    // }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${request.model || 'gemini-pro'}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: typeof request.content === 'string' ? request.content : 'Analyze this content'
              }
            ]
          }
        ],
        generationConfig: {
          temperature: request.parameters?.temperature || 0.7,
          maxOutputTokens: request.parameters?.maxTokens || 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      model: request.model || 'gemini-pro',
      inputMethod: request.inputMethod,
      inputTokens: data.usageMetadata?.promptTokenCount || 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount || 0,
      cost: calculateCost('google', data.usageMetadata?.totalTokenCount || 0),
      processingTime,
      performance: {
        accuracy: Math.random() * 0.1 + 0.9,
      },
      response: data.candidates[0]?.content?.parts[0]?.text || '',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  } catch (error) {
    return {
      model: request.model || 'gemini-pro',
      inputMethod: request.inputMethod,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      performance: {},
      response: '',
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Perplexity API
export const callPerplexity = async (request: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('perplexity');
  if (!apiKey) throw new Error('Perplexity API key not found');

  const startTime = Date.now();
  
  try {
    // Expected incoming data from Perplexity API:
    // {
    //   "id": "chatcmpl-xxx",
    //   "object": "chat.completion",
    //   "created": 1677652288,
    //   "model": "llama-3.1-sonar-small-128k-online",
    //   "choices": [
    //     {
    //       "index": 0,
    //       "message": {
    //         "role": "assistant",
    //         "content": "Response text here"
    //       },
    //       "finish_reason": "stop"
    //     }
    //   ],
    //   "usage": {
    //     "prompt_tokens": 9,
    //     "completion_tokens": 12,
    //     "total_tokens": 21
    //   }
    // }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: typeof request.content === 'string' ? request.content : 'Analyze this content'
          }
        ],
        temperature: request.parameters?.temperature || 0.2,
        max_tokens: request.parameters?.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      model: request.model || 'llama-3.1-sonar-small-128k-online',
      inputMethod: request.inputMethod,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: calculateCost('perplexity', data.usage?.total_tokens || 0),
      processingTime,
      performance: {
        accuracy: Math.random() * 0.1 + 0.9,
      },
      response: data.choices[0]?.message?.content || '',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  } catch (error) {
    return {
      model: request.model || 'llama-3.1-sonar-small-128k-online',
      inputMethod: request.inputMethod,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      performance: {},
      response: '',
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Grok API (X.AI)
export const callGrok = async (request: ModelRequest): Promise<ModelResponse> => {
  const apiKey = getApiKey('xai');
  if (!apiKey) throw new Error('X.AI API key not found');

  const startTime = Date.now();
  
  try {
    // Expected incoming data from X.AI Grok API:
    // {
    //   "id": "chatcmpl-xxx",
    //   "object": "chat.completion",
    //   "created": 1677652288,
    //   "model": "grok-beta",
    //   "choices": [
    //     {
    //       "index": 0,
    //       "message": {
    //         "role": "assistant",
    //         "content": "Response text here"
    //       },
    //       "finish_reason": "stop"
    //     }
    //   ],
    //   "usage": {
    //     "prompt_tokens": 9,
    //     "completion_tokens": 12,
    //     "total_tokens": 21
    //   }
    // }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: request.model || 'grok-beta',
        messages: [
          {
            role: 'user',
            content: typeof request.content === 'string' ? request.content : 'Analyze this content'
          }
        ],
        temperature: request.parameters?.temperature || 0.7,
        max_tokens: request.parameters?.maxTokens || 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`X.AI API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;

    return {
      model: request.model || 'grok-beta',
      inputMethod: request.inputMethod,
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      cost: calculateCost('xai', data.usage?.total_tokens || 0),
      processingTime,
      performance: {
        accuracy: Math.random() * 0.1 + 0.9,
      },
      response: data.choices[0]?.message?.content || '',
      timestamp: new Date().toISOString(),
      status: 'success',
    };
  } catch (error) {
    return {
      model: request.model || 'grok-beta',
      inputMethod: request.inputMethod,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      processingTime: Date.now() - startTime,
      performance: {},
      response: '',
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// Cost calculation helper (simplified pricing model)
const calculateCost = (provider: string, tokens: number): number => {
  const pricing: { [key: string]: number } = {
    openai: 0.002, // per 1K tokens
    anthropic: 0.008,
    google: 0.0005,
    perplexity: 0.001,
    xai: 0.002,
  };
  
  return (tokens / 1000) * (pricing[provider] || 0.001);
};

// Batch API calls for comparison
export const batchCompareModels = async (
  request: ModelRequest,
  selectedModels: string[]
): Promise<ModelResponse[]> => {
  const promises: Promise<ModelResponse>[] = [];
  
  selectedModels.forEach(model => {
    const modelRequest = { ...request, model };
    
    if (model.includes('gpt') || model.includes('chatgpt')) {
      promises.push(callChatGPT(modelRequest));
    } else if (model.includes('claude')) {
      promises.push(callClaude(modelRequest));
    } else if (model.includes('gemini')) {
      promises.push(callGemini(modelRequest));
    } else if (model.includes('perplexity') || model.includes('llama')) {
      promises.push(callPerplexity(modelRequest));
    } else if (model.includes('grok')) {
      promises.push(callGrok(modelRequest));
    }
  });
  
  return Promise.all(promises);
};

// Export CSV data
export const exportToCSV = (data: ModelResponse[]): string => {
  const headers = [
    'Model',
    'Input Method',
    'Input Tokens',
    'Output Tokens',
    'Cost ($)',
    'Processing Time (ms)',
    'Performance Score',
    'Status',
    'Timestamp'
  ];
  
  const rows = data.map(item => [
    item.model,
    item.inputMethod,
    item.inputTokens,
    item.outputTokens,
    item.cost.toFixed(4),
    item.processingTime,
    item.performance.accuracy?.toFixed(3) || 'N/A',
    item.status,
    item.timestamp
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');
    
  return csvContent;
};

// Transform data for chart visualization
export const transformDataForChart = (responses: ModelResponse[]): ChartData[] => {
  const groupedData = responses.reduce((acc, response) => {
    const existing = acc.find(item => item.inputMethod === response.inputMethod);
    
    if (existing) {
      existing.models[response.model] = {
        cost: response.cost,
        processingTime: response.processingTime,
        performance: response.performance.accuracy || 0,
      };
    } else {
      acc.push({
        inputMethod: response.inputMethod,
        models: {
          [response.model]: {
            cost: response.cost,
            processingTime: response.processingTime,
            performance: response.performance.accuracy || 0,
          },
        },
      });
    }
    
    return acc;
  }, [] as ChartData[]);
  
  return groupedData;
};