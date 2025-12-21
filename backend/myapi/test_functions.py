import time
import random
from decimal import Decimal
from .models import ExperimentResult, AIProvider
import openai
import anthropic
import google.generativeai as genai


def get_provider_client(model_object):
    """
    Returns the correct API client based on the model's provider.
    """
    provider = model_object.provider.name
    api_key = model_object.provider.api_key

    if provider == "openai":
        openai.api_key = api_key
        return openai
    elif provider == "anthropic":
        return anthropic.Anthropic(api_key=api_key)
    elif provider == "google":
        genai.configure(api_key=api_key)
        return genai
    elif provider == "perplexity":
        # Example: Use requests to call Perplexity API
        import requests
        return requests
    elif provider == "xai":
        # Placeholder for xAI client
        return None
    else:
        raise ValueError(f"Unsupported provider: {provider}")


import time
from google.api_core.exceptions import ResourceExhausted
def run_model_api(model_object, modality, task, input_data):
    """
    Calls the real API based on provider + model.
    Handles quota limits & retries gracefully.
    """
    provider = model_object.provider.name.lower()
    client = get_provider_client(model_object)

    if provider == "openai":
        response = client.ChatCompletion.create(
            model=model_object.name,
            messages=[
                {"role": "system", "content": f"You are solving task: {task}"},
                {"role": "user", "content": input_data},
            ],
        )
        return response.choices[0].message["content"], {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
            "total_tokens": response.usage.total_tokens,
        }

    elif provider == "anthropic":
        response = client.messages.create(
            model=model_object.name,
            max_tokens=500,
            messages=[{"role": "user", "content": input_data}],
        )
        return response.content[0].text, {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
            "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
        }

    elif provider == "google":
        model = client.GenerativeModel(model_object.name)

        retries = 3
        delay = 30  # Google suggests ~30s wait for 429
        for attempt in range(retries):
            try:
                response = model.generate_content(input_data)

                usage_meta = getattr(response, "usage_metadata", None)
                input_tokens = getattr(usage_meta, "prompt_token_count", 0)
                output_tokens = getattr(usage_meta, "candidates_token_count", 0)
                total_tokens = getattr(usage_meta, "total_token_count", input_tokens + output_tokens)

                return response.text, {
                    "input_tokens": input_tokens,
                    "output_tokens": output_tokens,
                    "total_tokens": total_tokens,
                }

            except Exception as e:
                if "ResourceExhausted" in str(e) and attempt < retries - 1:
                    print(f"[Google Gemini] Quota exceeded. Retrying in {delay}s (attempt {attempt+1})...")
                    time.sleep(delay)
                    delay *= 2  # exponential backoff
                else:
                    return f"Google API error: {e}", {
                        "input_tokens": 0,
                        "output_tokens": 0,
                        "total_tokens": 0,
                    }

    elif provider == "perplexity":
        headers = {"Authorization": f"Bearer {model_object.provider.api_key}"}
        data = {"model": model_object.name, "messages": [{"role": "user", "content": input_data}]}
        response = client.post("https://api.perplexity.ai/chat/completions", json=data, headers=headers)
        resp_json = response.json()
        return resp_json["choices"][0]["message"]["content"], None

    elif provider == "xai":
        return "xAI integration not implemented yet.", None

    return "Unsupported provider output", None



def calculate_cost(tokens_used, cost_per_token):
    """
    Calculates cost.
    """
    if not tokens_used or not cost_per_token:
        return Decimal("0.0")
    return Decimal(tokens_used) * Decimal(cost_per_token)



def normalize_text(text):
    """Simple text normalization"""
    if not text:
        return ""
    return "".join(c.lower() for c in text if c.isalnum() or c.isspace()).split()

def calculate_f1_score(prediction, ground_truth):
    """
    Calculates F1 score based on word overlap.
    """
    pred_tokens = normalize_text(prediction)
    truth_tokens = normalize_text(ground_truth)
    
    if not pred_tokens or not truth_tokens:
        return 0.0
        
    common_tokens = set(pred_tokens) & set(truth_tokens)
    num_same = len(common_tokens)
    
    if num_same == 0:
        return 0.0
        
    precision = num_same / len(pred_tokens)
    recall = num_same / len(truth_tokens)
    
    f1 = 2 * (precision * recall) / (precision + recall)
    return round(f1 * 100, 2)

def calculate_lcs(X, Y):
    """Longest Common Subsequence helper"""
    m = len(X)
    n = len(Y)
    L = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        for j in range(n + 1):
            if i == 0 or j == 0:
                L[i][j] = 0
            elif X[i-1] == Y[j-1]:
                L[i][j] = L[i-1][j-1] + 1
            else:
                L[i][j] = max(L[i-1][j], L[i][j-1])
    return L[m][n]

def calculate_rouge_l_score(prediction, ground_truth):
    """
    Calculates ROUGE-L score (sentence level LCS).
    """
    pred_tokens = normalize_text(prediction)
    truth_tokens = normalize_text(ground_truth)
    
    if not pred_tokens or not truth_tokens:
        return 0.0

    lcs_len = calculate_lcs(pred_tokens, truth_tokens)
    
    if lcs_len == 0:
        return 0.0
        
    precision = lcs_len / len(pred_tokens)
    recall = lcs_len / len(truth_tokens)
    
    if (precision + recall) == 0:
        return 0.0
        
    f_measure = 2 * (precision * recall) / (precision + recall)
    return round(f_measure * 100, 2)


def calculate_accuracy(model_output, ground_truth, method="f1"):
    """
    Calculates accuracy using F1-score or ROUGE-L.
    """
    if not ground_truth:
        return 0.0
        
    if method == "f1":
        return calculate_f1_score(model_output, ground_truth)
    elif method == "rouge_l":
        return calculate_rouge_l_score(model_output, ground_truth)
    
    return 0.0


def calculate_performance_metrics(experiment, model_object, input_data, modality, task, ground_truth=None):
    """
    Runs real API call, measures time, tokens, cost, saves ExperimentResult.
    """
    print(f"--- Running {model_object.name} ({model_object.provider}) with modality={modality}, task={task} ---")

    # 1. Run model + measure time
    start = time.time()
    try:
        model_output, usage = run_model_api(model_object, modality, task, input_data)
    except Exception as e:
        print(f"Error running model API: {e}")
        model_output = f"Error: {str(e)}"
        usage = {"total_tokens": 0}
        
    end = time.time()
    time_taken = end - start

    # 2. Tokens
    tokens_used = 0
    if usage:
        if "total_tokens" in usage:
            tokens_used = usage["total_tokens"]
        elif "input_tokens" in usage and "output_tokens" in usage:
            tokens_used = usage["input_tokens"] + usage["output_tokens"]

    # 3. Cost
    cost_per_token_field = f"cost_per_token_{modality}"
    cost_per_token = getattr(model_object, cost_per_token_field, None)
    cost = calculate_cost(tokens_used, cost_per_token)

    # 4. Accuracy (Real)
    # Determine method based on task (basic heuristic)
    method = "rouge_l" if "summariz" in str(task).lower() else "f1"
    
    accuracy = calculate_accuracy(model_output, ground_truth, method)

    result = {
        "tokens_used": tokens_used,
        "time_taken": time_taken,
        "cost": cost,
        "accuracy": accuracy,
        "response_text": model_output,
        "performance_score": (accuracy / (float(cost) + 0.000001)) * (1 / (time_taken + 0.01)),
    }

    return result
