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


def calculate_accuracy(model_output, ground_truth, method="f1"):
    """
    Placeholder accuracy (later plug in eval libs).
    """
    if method == "f1":
        return random.uniform(90.0, 95.0)
    elif method == "rouge_l":
        return random.uniform(80.0, 90.0)
    return random.uniform(85.0, 99.0)


def calculate_performance_metrics(experiment, model_object, input_data, modality, task):
    """
    Runs real API call, measures time, tokens, cost, saves ExperimentResult.
    """
    print(f"--- Running {model_object.name} ({model_object.provider}) with modality={modality}, task={task} ---")

    # 1. Run model + measure time
    start = time.time()
    model_output, usage = run_model_api(model_object, modality, task, input_data)
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

    # 4. Accuracy (placeholder)
    ground_truth = "Mock ground truth"
    accuracy = (
        calculate_accuracy(model_output, ground_truth, "f1")
        if task == "qa"
        else calculate_accuracy(model_output, ground_truth, "rouge_l")
    )

    result = {
        "tokens_used": tokens_used,
        "time_taken": time_taken,
        "cost": cost,
        "accuracy": accuracy,
        "response_text": model_output,
        "performance_score": (accuracy / (float(cost) + 0.01)) * (1 / (time_taken + 0.01)),
    }

    return result
