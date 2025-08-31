from django.db import models

class AIProvider(models.Model):
    """
    Model to store information about each AI provider.
    """
    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('anthropic', 'Anthropic'),
        ('google', 'Google'),
        ('perplexity', 'Perplexity'),
        ('xai', 'xAI'),
    ]
    name = models.CharField(max_length=50, choices=PROVIDER_CHOICES, unique=True)
    api_key = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.get_name_display()

class AIModel(models.Model):
    """
    Model to store the different AI models and their sub-models.
    A Foreign Key links each model to its provider.
    """
    provider = models.ForeignKey(AIProvider, on_delete=models.CASCADE, related_name='models')
    name = models.CharField(max_length=100)
    
    # New fields to store cost data per modality
    cost_per_token_text = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    cost_per_token_image = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    cost_per_token_audio = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    cost_per_token_video = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    cost_per_token_doc = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    
    supported_modalities = models.JSONField(default=list) # e.g., ['text', 'image', 'audio', 'video']

    def __str__(self):
        return f"{self.provider.name} - {self.name}"

class Experiment(models.Model):
    """
    Model to track each unique experiment run.
    """
    timestamp = models.DateTimeField(auto_now_add=True)
    source_content_type = models.CharField(max_length=50) # e.g., 'text', 'file_upload'
    source_content_url = models.URLField(max_length=500, null=True, blank=True) # URL to the uploaded content
    task_prompt = models.TextField()
    
    def __str__(self):
        return f"Experiment at {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"

class ExperimentResult(models.Model):
    """
    Model to store the detailed results for each model and modality tested within an experiment.
    """
    experiment = models.ForeignKey(Experiment, on_delete=models.CASCADE, related_name='results')
    model = models.ForeignKey(AIModel, on_delete=models.CASCADE)
    modality = models.CharField(max_length=50) # e.g., 'text', 'image'
    tokens_used = models.IntegerField()
    time_taken_seconds = models.DecimalField(max_digits=10, decimal_places=2)
    cost_usd = models.DecimalField(max_digits=10, decimal_places=5)
    accuracy_score = models.DecimalField(max_digits=5, decimal_places=2)
    response_text = models.TextField(null=True, blank=True)
    
    def __str__(self):
        return f"Result for {self.model.name} via {self.modality}"