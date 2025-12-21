import os
import io
from PIL import Image
from google import genai
import tiktoken
from openai import OpenAI
from typing import List, Union

# --- API Clients Initialization ---

from google import genai

# **Replace this with a secure method like os.environ['GEMINI_API_KEY']**
API_KEY = "AIzaSyDk98kfYAR3nIg1zn0gRgjJRnlKNzS-scA" 

try:
    gemini_client = genai.Client(api_key=API_KEY) # <--- Explicitly passing the key
    print("Gemini client initialized successfully.")
except Exception as e:
    print(f"Error initializing Gemini client: {e}")
    gemini_client = None


# Initialize OpenAI Client (reads OPENAI_API_KEY from environment)
try:
    openai_client = OpenAI()
except Exception as e:
    print(f"Error initializing OpenAI client: {e}")
    openai_client = None

# Get the tiktoken encoder for a common GPT model
def get_gpt_tokenizer(model_name: str = "gpt-4o"):
    """Returns the appropriate tiktoken encoding for text tokenization."""
    try:
        # GPT-4o typically uses 'o200k_base' or 'cl100k_base'
        # tiktoken.encoding_for_model() is safer
        return tiktoken.encoding_for_model(model_name)
    except ValueError:
        return tiktoken.get_encoding("cl100k_base") # Fallback for common models

# --- Token Counting Functions ---

def count_tokens_gemini(model: str, contents: List[Union[str, Image.Image]]) -> int:
    """Counts tokens for multimodal input using the Gemini API."""
    if not gemini_client:
        return -1
    try:
        response = gemini_client.models.count_tokens(model=model, contents=contents) 
        return response.total_tokens
    except Exception as e:
        print(f"Gemini token count error: {e}")
        return -1

def count_tokens_gpt_text(text: str, model_name: str = "gpt-4o") -> int:
    """Counts tokens for text input using the tiktoken library."""
    try:
        enc = get_gpt_tokenizer(model_name)
        return len(enc.encode(text))
    except Exception as e:
        print(f"GPT text token count error: {e}")
        return -1

def count_tokens_gpt_multimodal(prompt_text: str, image_path: str, model_name: str = "gpt-4o") -> int:
    """Estimates tokens for multimodal input (image + text) using the OpenAI API."""
    # For GPT models with vision, the token count for images is complex (tiling)
    # and is best retrieved directly from the API by simulating the call.
    if not openai_client:
        return -1
    try:
        with open(image_path, "rb") as image_file:
            base64_image = base64.b64encode(image_file.read()).decode("utf-8")
        
        response = openai_client.models.count_tokens(
            model=model_name,
            contents=[
                {"role": "user", "parts": [
                    {"text": prompt_text},
                    {"image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]}
            ]
        )
        return response.total_tokens
    except Exception as e:
        print(f"GPT multimodal token count error: {e}")
        # Alternatively, a full API call to generate_content can return the usage metadata
        # which includes token counts.
        return -1

# --- Example Usage ---

if __name__ == "__main__":
    # Example Text Input
    text_input = "The quick brown fox jumps over the lazy dog. Tokenization is fun! Let's see how many tokens this sentence uses. abcdefghijklmnopqrstuvwxyz 1234567890!@#$%^&*()_+-=[]{}|;:',.<>/?`~ after all, it's important to understand tokenization. asdfas dsaf;lkj sadfklja sdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj as"
    text_input = """Our primary finding reveals that for documents exceeding a modest threshold of approximately 800 words, converting text into an image-based input can achieve dramatic cost reductions of 70-95% compared to its native text equivalent. We formalize these phenomena by establishing empirical scaling laws and identifying precise modality break-even thresholds. To operationalize these insights, we introduce ModalRoute, an intelligent, adaptive routing framework that programmatically selects the most cost-effective modality for a given input. In our tests, ModalRoute achieved an average end-to-end cost reduction of 68% while preserving 97.3% of task performance. These findings offer actionable, data-driven optimization strategies and establish a foundational methodology for the emerging discipline of Token FinOps.""" 
    text_input = '''word count and complexity—at which alternative modalities become more cost-effective than plain text without compromising essential task performance?
                    RQ3: Can a systematic routing framework be developed to dynamically optimize the cost-performance trade-off in production-scale multimodal AI systems, and what are the practical latency and implementation challenges of such a system?
                    C. Contributions
                    The primary contributions of this work are both empirical and practical, providing a foundational resource for a new approach to LLM deployment:
                    The first systematic, cross-provider empirical analysis of multimodal tokenization costs, validated with real billing data. We move beyond theoretical FLOPS estimates to provide concrete, actionable economic data.
                    The derivation of empirical scaling laws that model cross-modal token efficiency for five major AI platforms. These models provide a predictive framework for cost estimation before a single token is processed.
                    The design and validation of  ModalRoute, a novel and lightweight framework for cost-optimal modality routing. We demonstrate that this approach yields average savings of 68% with minimal engineering overhead.
                    The release of an open-source benchmark and interactive playground, including our curated dataset, a Dockerized evaluation harness, and a dashboard for exploring cost-performance trade-offs. This toolkit is designed to promote reproducible research and community validation.
                    A set of actionable guidelines for production deployment, supported by quantified optimization strategies. These guidelines form a nascent handbook for the discipline of Token FinOps, bridging the gap between MLOps and cloud financial management.

                    FIG  FIGURE 2. The "ModalRoute" Framework

                    II. RELATED WORK
                    A. The Economics of Transformer-Based Inference
                    The cost of LLM inference is fundamentally tied to the transformer architecture's computational demands. The self-attention mechanism, the core of the transformer, exhibits a computational and memory complexity that scales quadratically with the sequence length (O(n²)), where n is the number of tokens [7]. This quadratic scaling makes processing long sequences exceptionally expensive. A significant portion of this cost is associated with the Key-Value (KV) cache, which stores intermediate attention states to accelerate generative tasks but grows linearly with the sequence length and batch size. Consequently, the primary levers for reducing inference cost are minimizing the number of input tokens and optimizing the management of the KV cache. Our work '''
    print("--- Text Input Token Comparison ---")
    
    # Gemini Text Token Count
    gemini_text_tokens = count_tokens_gemini(
        model="gemini-2.5-flash", 
        contents=[text_input]
    )
    print(f"Gemini-2.5-flash (Text): {gemini_text_tokens} tokens")
    
    # GPT Text Token Count
    gpt_model = "gpt-4o"
    gpt_text_tokens = count_tokens_gpt_text(text_input, model_name=gpt_model)
    print(f"{gpt_model} (Text - tiktoken): {gpt_text_tokens} tokens")

    print("\n--- Multimodal Input (Image + Text) Token Comparison ---")

    # To run the multimodal test, you'll need a local image file.
    # Create a small dummy image for this example
    try:
        dummy_image = Image.new('RGB', (500, 300), color = 'red')
        dummy_image.save("sample_image.png")
        image_path = "imge.jpg"
        prompt_with_image = ""
        # prompt_with_image = "Describe this image in detail.why the hack is this happening. asdfas dsaf;lkj sadfklja sdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdfklj asdf"

        # Gemini Multimodal Token Count
        image_part = Image.open(image_path)
        gemini_multimodal_tokens = count_tokens_gemini(
            model="gemini-2.5-flash", 
            contents=[prompt_with_image, image_part]
        )
        print(f"Gemini-2.5-flash (Image + Text): {gemini_multimodal_tokens} tokens")

        # GPT Multimodal Token Count (Requires the full OpenAI API call for image tokenizing)
        # Note: You need to install 'base64' and 'Pillow' for this part to work.
        import base64 
        gpt_multimodal_tokens = count_tokens_gpt_multimodal(
            prompt_with_image, 
            image_path, 
            model_name=gpt_model
        )
        print(f"{gpt_model} (Image + Text - API estimate): {gpt_multimodal_tokens} tokens")

        # Clean up the dummy image
        # os.remove(image_path)
    except FileNotFoundError:
        print("Skipping multimodal test: Could not create/find 'sample_image.png'.")
    except Exception as e:
        print(f"An error occurred during multimodal comparison: {e}")

    # For Audio and Video (Gemini only):
    # Gemini has fixed rates for audio (32 tokens/sec) and video (263 tokens/sec)
    # You would typically pass a File part using the File API for a full count.
    # The SDK's count_tokens can take a File object reference.
    print("\n--- Audio/Video Tokenization (Gemini rates) ---")
    print("Gemini (Audio): ~32 tokens per second of audio content.")
    print("Gemini (Video): ~263 tokens per second of video content.")