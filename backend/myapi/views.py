# myapi/views.py

import time
import random
from rest_framework import viewsets, mixins
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AIProvider, AIModel, Experiment, ExperimentResult
from .serializers import (
    AIProviderSerializer,
    AIModelSerializer,
    ExperimentSerializer,
    ExperimentResultSerializer,
    ModelTrendingDataSerializer,
)
from .test_functions import (
    calculate_performance_metrics,
)




## The main view function to be fixed
@api_view(['POST'])
def run_experiment_backend(request):
    print("\n--- NEW REQUEST RECEIVED ---")
    print("request.POST:", request.POST)
    print("request.FILES:", request.FILES)

    selected_model_ids = request.POST.getlist('model_ids[]')
    selected_tasks = request.POST.getlist('tasks[]')
    qa_questions = request.POST.getlist('qa_questions[]')

    print("Selected model IDs:", selected_model_ids)
    print("Selected tasks:", selected_tasks)
    print("QA questions:", qa_questions)

    # Merge POST + FILES
    all_data = {
        "text": request.POST.get("text_content", ""),
        "image": request.FILES.get("image_file"),
        "audio": request.FILES.get("audio_file"),
        "video": request.FILES.get("video_file"),
        "doc": request.FILES.get("document_file"),
    }

    # Check if any content was provided
    if not any(all_data.values()):
        print("\nNo valid input data provided. Skipping experiment.")
        return Response([])

    response_data = []

    new_experiment = Experiment.create_from_request(
        modalities = selected_tasks,
        all_data = all_data,
        task_prompt=f" Questions: {','.join(qa_questions)}" if qa_questions else " General analysis"
    )
    # Loop through each selected task to create a separate result entry
    for task_id in selected_tasks:
        print(f"\n--- Processing for task: {task_id} ---")
        
        # Create a new Experiment object for this task


        task_results = []
        for model_id in selected_model_ids:
            try:
                model = AIModel.objects.get(id=model_id)
                print(f"Processing model: {model.name} for task {task_id}")
            except AIModel.DoesNotExist:
                print(f"Model with ID {model_id} not found. Skipping.")
                continue
            
            modalities_data = []
            for modality, input_data in all_data.items():
                print(f"Checking modality: {modality}...")
                if input_data and modality in model.supported_modalities:
                    metrics = calculate_performance_metrics(new_experiment, model, input_data, modality, task_id )
                    Experimentresult = ExperimentResult.objects.create(
                        experiment=new_experiment,
                        model=model,
                        modality=modality,
                        tokens_used=metrics['tokens_used'],
                        time_taken_seconds=metrics['time_taken'],
                        cost_usd=metrics['cost'],
                        accuracy_score=metrics['accuracy'],
                        response_text=metrics['response_text'],
                    )
                    modalities_data.append({
                        'modality': modality,
                        'tokens_used': metrics['tokens_used'],
                        'time_taken_s': round(metrics['time_taken'], 2),
                        'cost_usd': round(metrics['cost'], 5),
                        'accuracy_score': metrics['accuracy'],
                        'performance_score': round(metrics['performance_score'], 2),
                    })
            
            task_results.append({
                'provider_name': model.provider.name,
                'model_name': model.name,
                'modalities': modalities_data,
            })
        
        response_data.append({
            'task_id': task_id,
            'task_name': task_id,  # Simplified for this fix.
            'results': task_results,
        })
    
    print("\n--- Final Response Data ---")
    print(response_data)
    print("\nExperiment and results saved.")
    
    return Response(response_data)


class AIProviderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for listing and retrieving AI providers.
    """
    queryset = AIProvider.objects.all()
    serializer_class = AIProviderSerializer

class AIModelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for listing and retrieving AI models.
    """
    queryset = AIModel.objects.all()
    serializer_class = AIModelSerializer

class ExperimentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for listing and retrieving experiments.
    """
    queryset = Experiment.objects.all()
    serializer_class = ExperimentSerializer

class ExperimentResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    A viewset for listing and retrieving experiment results.
    """
    queryset = ExperimentResult.objects.all()
    serializer_class = ExperimentResultSerializer




@api_view(['GET'])
def get_trending_data(request):
    results = ExperimentResult.objects.all().select_related('model').order_by('-accuracy_score')
    ranked_results = []
    for index, result in enumerate(results):
        result.rank = index + 1
        ranked_results.append(result)

    # Serialize the ranked data.
    serializer = ModelTrendingDataSerializer(ranked_results, many=True)
    return Response(serializer.data)