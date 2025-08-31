import time
import random
from decimal import Decimal

def measure_time_taken(api_call_function):
    """
    Measures the time taken for an API call function to execute.
    
    Args:
        api_call_function: A function that simulates an API call.
        
    Returns:
        A tuple containing the result of the function and the time taken in seconds.
    """
    start_time = time.time()
    result = api_call_function()
    end_time = time.time()
    return result, end_time - start_time

def calculate_cost(tokens_used, cost_per_token):
    """
    Calculates the total cost based on tokens and rate.
    
    Args:
        tokens_used (int): The number of tokens used.
        cost_per_token (Decimal): The cost per token.
        
    Returns:
        Decimal: The total cost.
    """
    if cost_per_token is None:
        return Decimal('0.0')
    return Decimal(str(tokens_used)) * Decimal(str(cost_per_token))

def calculate_tokens_used(input_data):
    """
    Simulates token counting for input data.
    
    Args:
        input_data: The input content (text, file object, etc.).
        
    Returns:
        int: A simulated number of tokens.
    """
    # Simple word count for text, or mock values for files
    if isinstance(input_data, str):
        word_count = len(input_data.split())
        return int(word_count * 1.33)
    # For file-based inputs, use a random mock value
    else:
        return random.randint(100, 2000)

def calculate_accuracy(model_output, ground_truth, method='f1'):
    """
    This function is a mock implementation for demonstration.
    
    Args:
        model_output (str): The mock output from the model.
        ground_truth (str): The mock ground truth.
        method (str): The evaluation method ('f1', 'rouge_l', etc.).
        
    Returns:
        float: A simulated accuracy score.
    """
    if method == 'f1':
        return random.uniform(90.0, 95.0)
    elif method == 'rouge_l':
        return random.uniform(0.80, 0.90) * 100
    return random.uniform(85.0, 99.0)

def calculate_performance_metrics(model_object, input_data, modality, task):
    """
    Calculates and returns a dictionary of performance metrics for a given model and input data.
    
    Args:
        model_object: The AIModel object containing cost data.
        input_data: The content to be processed (e.g., text, image data).
        modality: The modality of the input data ('text', 'image', etc.).
        task: The task ID ('qa', 'summarization', etc.).
        
    Returns:
        A dictionary containing time_taken, cost, tokens_used, accuracy, and a performance score.
    """
    print(f"--- Calculating metrics for {model_object.name} with {modality} data for task '{task}' ---")

    # 1. Define a single mock API call function
    def get_mock_output():
        time.sleep(random.uniform(2.0, 5.0))
        return "Mock model output from the AI model."

    # 2. Measure time taken and get the output in one go.
    model_output, time_taken = measure_time_taken(get_mock_output)

    # 3. Calculate tokens used from the model's output
    tokens_used = calculate_tokens_used(input_data)

    # 4. Get the cost per token for the specific modality from the model object
    cost_per_token_attribute = f'cost_per_token_{modality}'
    cost_per_token = getattr(model_object, cost_per_token_attribute, None)
    cost = calculate_cost(tokens_used, cost_per_token)

    # 5. Calculate accuracy
    ground_truth = "Mock ground truth"
    accuracy = calculate_accuracy(model_output, ground_truth, method='f1') if task == 'qa' else calculate_accuracy(model_output, ground_truth, method='rouge_l')

    # 6. Calculate the composite performance score
    performance_score = 0.0
    if cost > 0 and time_taken > 0:
        performance_score = (accuracy / 100) / (float(cost) * time_taken)

    # 7. Return the results as a dictionary
    return {
        'time_taken': time_taken,
        'cost': cost,
        'tokens_used': tokens_used,
        'accuracy': accuracy,
        'performance_score': performance_score,
        'response_text': "Mock model output from the AI model."
    }