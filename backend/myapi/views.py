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
)
from .test_functions import (
    calculate_performance_metrics,
)




# --- API View ---


from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AIModel, Experiment, ExperimentResult
import time
import random

# src/myapi/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AIModel, Experiment, ExperimentResult
import time
import random

# Mock functions (keep these as they are, they are not the source of the issue)
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import AIModel, Experiment, ExperimentResult
import time
import random

# Mock functions to simulate a real-world scenario
def calculate_performance_metrics(model, input_data, modality, task):
    # This is a placeholder for your actual logic to call an AI model
    start_time = time.time()
    time.sleep(random.uniform(2.0, 5.0))
    end_time = time.time()
    
    time_taken = end_time - start_time
    
    tokens_used = 0
    if modality == 'text' and input_data:
        tokens_used = len(str(input_data).split()) * 1.33
    elif modality == 'image' and input_data:
        tokens_used = random.randint(150, 200)
    elif modality == 'audio' and input_data:
        tokens_used = random.randint(25000, 30000)
    elif modality == 'video' and input_data:
        tokens_used = random.randint(2200, 2600)
    elif modality == 'doc' and input_data:
        tokens_used = random.randint(1200, 1400)
    
    tokens_used = max(1, int(tokens_used))
    
    cost_per_token_attribute = f'cost_per_token_{modality}'
    cost_per_token = getattr(model, cost_per_token_attribute, None)
    
    cost = 0.0
    if cost_per_token is not None:
        cost = float(cost_per_token) * tokens_used
    
    accuracy_score = random.uniform(90.0, 95.0)
    performance_score = (accuracy_score / 100) / (cost * time_taken + 1e-6)

    return {
        'time_taken': time_taken,
        'cost': cost,
        'tokens_used': tokens_used,
        'accuracy': accuracy_score,
        'performance_score': performance_score
    }

## The main view function to be fixed
@api_view(['POST'])
def run_experiment_backend(request):
    print("\n--- NEW REQUEST RECEIVED ---")
    print("request.POST:", request.POST)
    print("request.FILES:", request.FILES)
    
    # FIX: Use a more robust method to retrieve list data from the QueryDict.
    # The keys have an index attached (e.g., 'tasks[0]', 'tasks[1]'), so getlist()
    # won't work on the top-level key. We iterate and build the lists ourselves.
    selected_model_ids = [v for k, v in request.POST.items() if k.startswith('model_ids')]
    selected_tasks = [v for k, v in request.POST.items() if k.startswith('tasks')]
    qa_questions = [v for k, v in request.POST.items() if k.startswith('qa_questions')]
    
    print("Selected model IDs:", selected_model_ids)
    print("Selected tasks:", selected_tasks)
    print("QA questions:", qa_questions)
    
    # Combine POST and FILES data into a single dictionary
    all_data = {
        'text': request.POST.get('text_content', ''),
        'image': request.FILES.get('image_file', None),
        'audio': request.FILES.get('audio_file', None),
        'video': request.FILES.get('video_file', None),
        'doc': request.FILES.get('document_file', None),
    }

    # Check if any content was provided
    if not any(all_data.values()):
        print("\nNo valid input data provided. Skipping experiment.")
        return Response([])

    response_data = []

    # Loop through each selected task to create a separate result entry
    for task_id in selected_tasks:
        print(f"\n--- Processing for task: {task_id} ---")
        
        # Create a new Experiment object for this task
        new_experiment = Experiment.objects.create(
            source_content_type='multimodal',
            task_prompt=f"Task: {task_id}, Questions: {','.join(qa_questions)}" if task_id == 'qa' else f"Task: {task_id}"
        )

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
                if input_data and modality in model.supported_modalities['types']:
                    metrics = calculate_performance_metrics(model, input_data, modality, task_id)
                    
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