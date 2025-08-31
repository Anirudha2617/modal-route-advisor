import { useState, useEffect } from 'react';
import { getApiKey, setApiKey } from '@/services/aiModelsApi';

export interface ApiKeyConfig {
  provider: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export const API_PROVIDERS: ApiKeyConfig[] = [
  {
    provider: 'openai',
    label: 'OpenAI API Key',
    placeholder: 'sk-...',
    required: true,
  },
  {
    provider: 'anthropic',
    label: 'Anthropic API Key',
    placeholder: 'sk-ant-...',
    required: true,
  },
  {
    provider: 'google',
    label: 'Google AI API Key',
    placeholder: 'AIza...',
    required: true,
  },
  {
    provider: 'perplexity',
    label: 'Perplexity API Key',
    placeholder: 'pplx-...',
    required: false,
  },
  {
    provider: 'xai',
    label: 'X.AI (Grok) API Key',
    placeholder: 'xai-...',
    required: false,
  },
];

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load API keys from localStorage on mount
  useEffect(() => {
    const loadApiKeys = () => {
      const keys: Record<string, string> = {};
      
      API_PROVIDERS.forEach(provider => {
        const key = getApiKey(provider.provider);
        if (key) {
          keys[provider.provider] = key;
        }
      });
      
      setApiKeys(keys);
      setLoading(false);
    };

    loadApiKeys();
  }, []);

  const updateApiKey = (provider: string, key: string) => {
    if (key.trim()) {
      setApiKey(provider, key.trim());
      setApiKeys(prev => ({
        ...prev,
        [provider]: key.trim(),
      }));
    } else {
      // Remove key if empty
      localStorage.removeItem(`apiKey_${provider}`);
      setApiKeys(prev => {
        const newKeys = { ...prev };
        delete newKeys[provider];
        return newKeys;
      });
    }
  };

  const removeApiKey = (provider: string) => {
    localStorage.removeItem(`apiKey_${provider}`);
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
      return newKeys;
    });
  };

  const hasApiKey = (provider: string): boolean => {
    return Boolean(apiKeys[provider]?.trim());
  };

  const getAvailableProviders = (): string[] => {
    return API_PROVIDERS
      .filter(provider => hasApiKey(provider.provider))
      .map(provider => provider.provider);
  };

  const isConfigured = (): boolean => {
    const requiredProviders = API_PROVIDERS.filter(p => p.required);
    return requiredProviders.every(provider => hasApiKey(provider.provider));
  };

  const getMissingKeys = (): ApiKeyConfig[] => {
    return API_PROVIDERS.filter(provider => 
      provider.required && !hasApiKey(provider.provider)
    );
  };

  return {
    apiKeys,
    loading,
    updateApiKey,
    removeApiKey,
    hasApiKey,
    getAvailableProviders,
    isConfigured,
    getMissingKeys,
  };
};