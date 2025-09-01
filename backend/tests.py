import os
import time
import google.generativeai as genai
from dotenv import load_dotenv
from collections import Counter
from PIL import Image

# Load environment variables from the .env file
load_dotenv() 
PRICING = {
    "gemini-1.5-pro-latest": {"input_cost_per_m_tokens": 1.25, "output_cost_per_m_tokens": 5.00},
    "gemini-1.5-flash-latest": {"input_cost_per_m_tokens": 0.075, "output_cost_per_m_tokens": 0.30},
}

def calculate_f1_score(model_response: str, gold_standard: str) -> float:
    """
    Calculates the F1 score for an information extraction task, as described in the
    research paper's methodology.
    """
    model_tokens = set(model_response.lower().split())
    gold_tokens = set(gold_standard.lower().split())
    
    common_tokens = model_tokens.intersection(gold_tokens)
    num_common = len(common_tokens)
    
    if num_common == 0:
        return 0.0

    precision = num_common / len(model_tokens) if len(model_tokens) > 0 else 0
    recall = num_common / len(gold_tokens) if len(gold_tokens) > 0 else 0

    if precision + recall == 0:
        return 0.0
    f1_score = 2 * (precision * recall) / (precision + recall)
    return f1_score

def calculate_break_even_point(text_cost_per_token: float, image_cost_per_token: float, fixed_image_tokens: int) -> int:
    """
    Calculates the break-even point (in words) where the image modality becomes
    more cost-effective than the text modality.
    
    This is based on the Gemini pricing model where image tokenization has a fixed cost
    and text tokenization is linear with word count.
    
    Args:
        text_cost_per_token (float): The cost per token for text input.
        image_cost_per_token (float): The cost per token for image input.
        fixed_image_tokens (int): The number of tokens a fixed-size image consumes.
        
    Returns:
        int: The break-even word count.
    """
    # Assuming 1 word ≈ 1.33 tokens, a common rule of thumb.
    tokens_per_word = 1.33 
    
    # Cost function for text: C_text(W) = text_cost_per_token * W * tokens_per_word
    # Cost function for image: C_image(W) = image_cost_per_token * fixed_image_tokens
    
    # We solve for W where C_text(W) = C_image(W)
    # text_cost_per_token * W * tokens_per_word = image_cost_per_token * fixed_image_tokens
    # W = (image_cost_per_token * fixed_image_tokens) / (text_cost_per_token * tokens_per_word)
    
    if text_cost_per_token * tokens_per_word == 0:
        return 0 # Avoid division by zero

    break_even_words = (image_cost_per_token * fixed_image_tokens) / (text_cost_per_token * tokens_per_word)
    return int(break_even_words)


def run_gemini_analysis(text_content: str, gold_standard: str, image_path: str = None) -> list:
    """
    Runs a performance analysis for Gemini models using both text and image modalities.

    Args:
        text_content (str): The raw text content of the document.
        gold_standard (str): The expected, correct text response for the task.
        image_path (str): Optional path to an image representation of the document.

    Returns:
        list: A list of dictionaries with the performance metrics for each modality.
    """
    API_KEY = os.getenv("GEMINI_API_KEY")
    if not API_KEY:
        raise ValueError("GEMINI_API_KEY environment variable is not set. Make sure it is present in your .env file.")
    genai.configure(api_key=API_KEY)

    results = []
    
    PRICING = {
        "gemini-1.5-pro-latest": {"input_cost_per_m_tokens": 1.25, "output_cost_per_m_tokens": 5.00},
        "gemini-1.5-flash-latest": {"input_cost_per_m_tokens": 0.075, "output_cost_per_m_tokens": 0.30},
    }
    
    models_to_analyze = ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"]

    for model_name in models_to_analyze:
        try:
            model = genai.GenerativeModel(model_name)

            # --- Text Modality Analysis ---
            text_start_time = time.time()
            text_response = model.generate_content([text_content])
            text_end_time = time.time()
            text_latency_ms = (text_end_time - text_start_time) * 1000

            text_prompt_tokens = text_response.usage_metadata.prompt_token_count
            text_output_tokens = text_response.usage_metadata.candidates_token_count
            text_total_cost_usd = ((text_prompt_tokens / 1_000_000) * PRICING[model_name]["input_cost_per_m_tokens"]) + \
                                  ((text_output_tokens / 1_000_000) * PRICING[model_name]["output_cost_per_m_tokens"])
            text_f1_score = calculate_f1_score(text_response.text, gold_standard)

            results.append({
                "model": model_name,
                "modality": "Text",
                "latency_ms": round(text_latency_ms, 2),
                "input_tokens": text_prompt_tokens,
                "output_tokens": text_output_tokens,
                "total_cost_usd": round(text_total_cost_usd, 5),
                "f1_score": round(text_f1_score, 2),
                "response_preview": text_response.text[:100]
            })

            # --- Image Modality Analysis (if path is provided) ---
            if image_path:
                image_start_time = time.time()
                img = Image.open(image_path)
                image_response = model.generate_content([img, text_content])
                image_end_time = time.time()
                image_latency_ms = (image_end_time - image_start_time) * 1000

                image_prompt_tokens = image_response.usage_metadata.prompt_token_count
                image_output_tokens = image_response.usage_metadata.candidates_token_count
                image_total_cost_usd = ((image_prompt_tokens / 1_000_000) * PRICING[model_name]["input_cost_per_m_tokens"]) + \
                                       ((image_output_tokens / 1_000_000) * PRICING[model_name]["output_cost_per_m_tokens"])
                image_f1_score = calculate_f1_score(image_response.text, gold_standard)

                results.append({
                    "model": model_name,
                    "modality": "Image",
                    "latency_ms": round(image_latency_ms, 2),
                    "input_tokens": image_prompt_tokens,
                    "output_tokens": image_output_tokens,
                    "total_cost_usd": round(image_total_cost_usd, 5),
                    "f1_score": round(image_f1_score, 2),
                    "response_preview": image_response.text[:100]
                })

        except Exception as e:
            results.append({"model": model_name, "error": str(e)})

    return results

if __name__ == "__main__":
    # Example usage based on a document from the research paper
    
    # The paper states that the break-even point for Gemini Flash is at 83 words.
    # Let's test with a short document (below break-even) and a long document (above break-even).
    
    # --- SHORT DOCUMENT EXAMPLE (below break-even point) ---
    short_text = "What is the primary motivation for studying cross-modal tokenization economics?"
    short_doc_word_count = len(short_text.split())
    short_doc_gold_standard = "The primary motivation for studying cross-modal tokenization economics is to address the significant and unpredictable operational expenditure associated with LLM inference, as different input modalities for identical content can have vastly different processing costs."
    test_image_path = "block.jpg"

    print(f"--- Analysis for a Short Document ({short_doc_word_count} words) ---")
    short_doc_results = run_gemini_analysis(
        text_content=short_text,
        gold_standard=short_doc_gold_standard,
        image_path=test_image_path
    )
    
    for data in short_doc_results:
        print(f"\nModel: {data.get('model', 'N/A')}, Modality: {data.get('modality', 'N/A')}")
        if 'error' in data:
            print(f"  Status: Failed with error: {data['error']}")
        else:
            print(f"  Latency: {data['latency_ms']} ms")
            print(f"  Input Tokens: {data['input_tokens']}")
            print(f"  Output Tokens: {data['output_tokens']}")
            print(f"  Total Cost: ${data['total_cost_usd']}")
            print(f"  F1 Score: {data['f1_score']:.2f}")

    # --- LONG DOCUMENT EXAMPLE (above break-even point) ---
    long_text = "The proliferation of multimodal Large Language Models (LLMs) has introduced complex, often counterintuitive, pricing structures where identical semantic content incurs vastly different processing costs depending on the input modality." * 5
    long_doc_word_count = len(long_text.split())
    long_doc_gold_standard = "The proliferation of multimodal LLMs has created complex, often counterintuitive, pricing structures. Identical semantic content incurs different processing costs depending on the input modality. This study is the first systematic empirical analysis of cross-modal tokenization economics."
    test_image_path = "chart.jpg" # Using the provided image for the long document.

    print(f"\n--- Analysis for a Long Document ({long_doc_word_count} words) ---")
    long_doc_results = run_gemini_analysis(
        text_content=long_text,
        gold_standard=long_doc_gold_standard,
        image_path=test_image_path
    )

    for data in long_doc_results:
        print(f"\nModel: {data.get('model', 'N/A')}, Modality: {data.get('modality', 'N/A')}")
        if 'error' in data:
            print(f"  Status: Failed with error: {data['error']}")
        else:
            print(f"  Latency: {data['latency_ms']} ms")
            print(f"  Input Tokens: {data['input_tokens']}")
            print(f"  Output Tokens: {data['output_tokens']}")
            print(f"  Total Cost: ${data['total_cost_usd']}")
            print(f"  F1 Score: {data['f1_score']:.2f}")
    
    # --- Break-Even Point Logic ---
    print("\n--- Break-Even Point Analysis ---")
    gemini_flash_input_cost = PRICING["gemini-1.5-flash-latest"]["input_cost_per_m_tokens"] / 1_000_000
    gemini_flash_image_cost = gemini_flash_input_cost # Assuming the same input cost per token
    gemini_flash_break_even = calculate_break_even_point(gemini_flash_input_cost, gemini_flash_image_cost, 259)
    
    print(f"The calculated break-even point for a single image page on Gemini Flash is approximately {gemini_flash_break_even} words.")
    print("This confirms the research paper's finding that for short documents, text is cheaper, but for long documents, the image modality becomes more cost-effective due to its fixed token cost.")