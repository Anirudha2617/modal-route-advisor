from rest_framework import serializers
from .models import AIProvider, AIModel, Experiment, ExperimentResult

class AIProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIProvider
        fields = '__all__'

class AIModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = '__all__'

class ExperimentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExperimentResult
        fields = '__all__'

class ExperimentSerializer(serializers.ModelSerializer):
    results = ExperimentResultSerializer(many=True, read_only=True)
    
    class Meta:
        model = Experiment
        fields = '__all__'