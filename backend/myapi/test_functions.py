import time
import random

def measure_time_taken(api_call_function):
    """
    Measures the time taken for an API call function to execute.
    """
    start_time = time.time()
    result = api_call_function()
    end_time = time.time()
    return result, end_time - start_time

def calculate_cost(tokens_used, cost_per_token):
    """
    Calculates the total cost based on tokens and rate.
    """
    return float(tokens_used) * float(cost_per_token)

def calculate_tokens_used(input_data):
    """
    Simulates token counting for input data.
    """
    word_count = len(str(input_data).split())
    return int(word_count * 1.33)

def calculate_accuracy(model_output, ground_truth, method='f1'):
    """
    This function is a mock implementation for demonstration.
    """
    if method == 'f1':
        return random.uniform(90.0, 95.0)
    elif method == 'rouge_l':
        return random.uniform(0.80, 0.90)
    return random.uniform(85.0, 99.0)

# The core function to refactor
def calculate_performance_metrics(model_object, input_data, modality):
    """
    Calculates and returns a dictionary of performance metrics for a given model and input data.
    
    Args:
        model_object: The AIModel object containing cost data.
        input_data: The content to be processed (e.g., text, image data).
        modality: The modality of the input data ('text', 'image', etc.).
    
    Returns:
        A dictionary containing time_taken, cost, tokens_used, accuracy, and a performance score.
    """
    # 1. Define a single mock API call function to avoid duplicate work.
    def get_mock_output():
        # Simulates a delay for the model's response time
        time.sleep(random.uniform(2.0, 5.0))
        return "Mock model output from the AI model."

    # 2. Measure time taken and get the output in one go.
    model_output, time_taken = measure_time_taken(get_mock_output)

    # 3. Calculate tokens used from the model's output
    tokens_used = calculate_tokens_used(model_output)

    # 4. Get the cost per token for the specific modality from the model object
    cost_per_token_attribute = f'cost_per_token_{modality}'
    cost_per_token = getattr(model_object, cost_per_token_attribute, 0)
    cost = calculate_cost(tokens_used, cost_per_token)

    # 5. Calculate accuracy
    ground_truth = "Mock ground truth"
    accuracy = calculate_accuracy(model_output, ground_truth)

    # 6. Calculate the composite performance score
    performance_score = (accuracy / 100) / (cost * time_taken + 1e-6)

    # 7. Return the results as a dictionary
    return {
        'time_taken': time_taken,
        'cost': cost,
        'tokens_used': tokens_used,
        'accuracy': accuracy,
        'performance_score': performance_score
    }