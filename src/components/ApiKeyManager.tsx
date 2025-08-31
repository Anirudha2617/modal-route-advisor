import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, Key, Shield, Trash2, AlertTriangle, CheckCircle, Settings } from "lucide-react";
import { useApiKeys, API_PROVIDERS } from '@/hooks/useApiKeys';

interface ApiKeyManagerProps {
  className?: string;
  showAsDialog?: boolean;
  trigger?: React.ReactNode;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  className = "",
  showAsDialog = false,
  trigger
}) => {
  const { 
    apiKeys, 
    loading, 
    updateApiKey, 
    removeApiKey, 
    hasApiKey, 
    isConfigured, 
    getMissingKeys 
  } = useApiKeys();
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<Record<string, string>>({});

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider],
    }));
  };

  const handleKeyChange = (provider: string, value: string) => {
    setTempKeys(prev => ({
      ...prev,
      [provider]: value,
    }));
  };

  const saveKey = (provider: string) => {
    const key = tempKeys[provider] || '';
    updateApiKey(provider, key);
    setTempKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
      return newKeys;
    });
  };

  const getKeyDisplay = (provider: string, key: string) => {
    if (showKeys[provider]) {
      return key;
    }
    return key.substring(0, 8) + '...';
  };

  const getProviderStatus = (provider: string) => {
    if (hasApiKey(provider)) {
      return <Badge className="bg-success text-success-foreground">Connected</Badge>;
    }
    return <Badge variant="outline">Not Set</Badge>;
  };

  const missingKeys = getMissingKeys();

  const content = (
    <div className={`space-y-6 ${className}`}>
      {loading && (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Loading API keys...</p>
        </div>
      )}

      {!loading && (
        <>
          {/* Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                API Configuration Status
              </CardTitle>
              <CardDescription>
                Manage your API keys for different AI model providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                {isConfigured() ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-success font-medium">All required API keys are configured</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span className="text-warning font-medium">
                      {missingKeys.length} required API key{missingKeys.length !== 1 ? 's' : ''} missing
                    </span>
                  </>
                )}
              </div>

              {!isConfigured() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please configure the following required API keys: {' '}
                    {missingKeys.map(key => key.label).join(', ')}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* API Key Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>
                Your API keys are stored locally in your browser. They are not sent to our servers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="required" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="required">Required APIs</TabsTrigger>
                  <TabsTrigger value="optional">Optional APIs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="required" className="space-y-4">
                  {API_PROVIDERS.filter(p => p.required).map((provider) => (
                    <div key={provider.provider} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          <Label htmlFor={provider.provider} className="font-medium">
                            {provider.label}
                          </Label>
                        </div>
                        {getProviderStatus(provider.provider)}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id={provider.provider}
                            type={showKeys[provider.provider] ? "text" : "password"}
                            placeholder={provider.placeholder}
                            value={tempKeys[provider.provider] ?? (apiKeys[provider.provider] || '')}
                            onChange={(e) => handleKeyChange(provider.provider, e.target.value)}
                          />
                          {apiKeys[provider.provider] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => toggleKeyVisibility(provider.provider)}
                            >
                              {showKeys[provider.provider] ? 
                                <EyeOff className="h-3 w-3" /> : 
                                <Eye className="h-3 w-3" />
                              }
                            </Button>
                          )}
                        </div>
                        <Button
                          onClick={() => saveKey(provider.provider)}
                          disabled={!tempKeys[provider.provider]?.trim()}
                        >
                          Save
                        </Button>
                        {hasApiKey(provider.provider) && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeApiKey(provider.provider)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {apiKeys[provider.provider] && (
                        <p className="text-xs text-muted-foreground">
                          Current key: {getKeyDisplay(provider.provider, apiKeys[provider.provider])}
                        </p>
                      )}
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="optional" className="space-y-4">
                  {API_PROVIDERS.filter(p => !p.required).map((provider) => (
                    <div key={provider.provider} className="space-y-3 p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Key className="h-4 w-4" />
                          <Label htmlFor={provider.provider} className="font-medium">
                            {provider.label}
                          </Label>
                        </div>
                        {getProviderStatus(provider.provider)}
                      </div>
                      
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Input
                            id={provider.provider}
                            type={showKeys[provider.provider] ? "text" : "password"}
                            placeholder={provider.placeholder}
                            value={tempKeys[provider.provider] ?? (apiKeys[provider.provider] || '')}
                            onChange={(e) => handleKeyChange(provider.provider, e.target.value)}
                          />
                          {apiKeys[provider.provider] && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                              onClick={() => toggleKeyVisibility(provider.provider)}
                            >
                              {showKeys[provider.provider] ? 
                                <EyeOff className="h-3 w-3" /> : 
                                <Eye className="h-3 w-3" />
                              }
                            </Button>
                          )}
                        </div>
                        <Button
                          onClick={() => saveKey(provider.provider)}
                          disabled={!tempKeys[provider.provider]?.trim()}
                        >
                          Save
                        </Button>
                        {hasApiKey(provider.provider) && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeApiKey(provider.provider)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {apiKeys[provider.provider] && (
                        <p className="text-xs text-muted-foreground">
                          Current key: {getKeyDisplay(provider.provider, apiKeys[provider.provider])}
                        </p>
                      )}
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Your API keys are stored locally in your browser's localStorage. 
              They are never sent to our servers. For production use, consider implementing proper backend API key management.
            </AlertDescription>
          </Alert>
        </>
      )}
    </div>
  );

  if (showAsDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              API Keys
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>API Key Management</DialogTitle>
            <DialogDescription>
              Configure your API keys for AI model providers
            </DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return content;
};

export default ApiKeyManager;