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


class AiModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIModel
        fields = ["id", "name", "provider"]   # <-- add any extra fields you want

class ResultSerializer(serializers.ModelSerializer):
    model = AiModelSerializer(read_only=True)  # <-- nest here

    class Meta:
        model = ExperimentResult
        fields = [
            "id",
            "modality",
            "tokens_used",
            "time_taken_seconds",
            "cost_usd",
            "accuracy_score",
            "response_text",
            "experiment",
            "model",
        ]

class ExperimentSerializer(serializers.ModelSerializer):
    results = ResultSerializer(many=True, read_only=True)

    class Meta:
        model = Experiment
        fields = [
            "id",
            "results",
            "timestamp",
            "modalities",
            "source_content_url",
            "data_types",
            "task_prompt",
        ]




class ModelTrendingDataSerializer(serializers.Serializer):
    rank = serializers.IntegerField() # Removed source='rank'
    provider = serializers.CharField(source='model.name')
    company = serializers.CharField(source='model.provider.name')
    avgCost = serializers.DecimalField(max_digits=10, decimal_places=2, source='cost_usd')
    avgLatency = serializers.DecimalField(max_digits=10, decimal_places=2, source='time_taken_seconds')
    qualityScore = serializers.DecimalField(max_digits=5, decimal_places=2, source='accuracy_score')
    costEfficiency = serializers.DecimalField(max_digits=10, decimal_places=2 , default=0.0 ) 
    trend = serializers.CharField(default="up")

    def create(self, validated_data):
        raise NotImplementedError("This serializer is read-only.")

    def update(self, instance, validated_data):
        raise NotImplementedError("This serializer is read-only.")

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        
        # Calculate cost efficiency. This requires the qualityScore and avgCost to be available
        # It's better to compute this on the fly for the response.
        if instance.cost_usd > 0:
            representation['costEfficiency'] = round(float(instance.accuracy_score) / float(instance.cost_usd), 2)
        else:
            representation['costEfficiency'] = 0.0

        representation['rank'] = 1 

        return representation