import os
import csv
import time
from pathlib import Path
from google import genai
from openai import OpenAI
import tiktoken
from PIL import Image
from typing import List, Union


# --- Initialize Clients ---
API_KEY = "AIzaSyDk98kfYAR3nIg1zn0gRgjJRnlKNzS-scA" 

try:
    gemini_client = genai.Client(api_key=API_KEY)
    print("[DEBUG] Gemini client initialized successfully.")
except Exception as e:
    print(f"[DEBUG] Error initializing Gemini client: {e}")
    gemini_client = None

try:
    openai_client = OpenAI()
    print("[DEBUG] OpenAI client initialized successfully.")
except Exception as e:
    print(f"[DEBUG] OpenAI client not initialized: {e}")
    openai_client = None

# --- Token Counting Functions ---
def get_gpt_tokenizer(model_name="gpt-4o"):
    try:
        return tiktoken.encoding_for_model(model_name)
    except ValueError:
        return tiktoken.get_encoding("cl100k_base")

def count_tokens_gemini_text(text):
    if not gemini_client:
        return None
    try:
        res = gemini_client.models.count_tokens(model="gemini-2.5-flash", contents=[text])
        return res.total_tokens
    except Exception as e:
        print(f"[DEBUG] Gemini token error: {e}")
        return None

def count_tokens_gemini(model: str, contents: List[Union[str, Image.Image]]) -> int:
    """Counts tokens for multimodal input using the Gemini API."""
    if not gemini_client:
        return None
    try:
        response = gemini_client.models.count_tokens(model=model, contents=contents) 
        return response.total_tokens
    except Exception as e:
        print(f"Gemini token count error: {e}")
        return -1

def count_tokens_gpt_text(text):
    if not openai_client:
        return None
    try:
        enc = get_gpt_tokenizer()
        return len(enc.encode(text))
    except Exception as e:
        print(f"[DEBUG] GPT token error: {e}")
        return None

# --- Paths ---
DATASET_DIR = Path("./enterprise_multimodal_dataset_60/short_docs")
OUTPUT_DIR = Path("./short_docs_question_tokens_debug")
OUTPUT_DIR.mkdir(exist_ok=True)

txt_files = list(DATASET_DIR.glob("*.txt"))
total_files = len(txt_files)
print(f"[DEBUG] Total short_docs TXT files found: {total_files}\n")

all_results = []

def extract_questions(text):
    """Extract questions: lines starting with Q, Question, or RQ; fallback: whole text"""
    lines = text.split("\n")
    qs = [line.strip() for line in lines if line.strip().startswith(("Q", "Question", "RQ"))]
    if not qs:
        print("[DEBUG] No explicit questions detected; treating whole text as one question.")
        return [text]
    return qs


# --- Process documents ---
for idx, txt_file in enumerate(txt_files, start=1):
    doc_id = txt_file.stem
    png_file = txt_file.with_suffix(".png")
    print(f"[DEBUG] [{idx}/{total_files}] Processing document: {txt_file.name}")
    
    with open(txt_file, "r", encoding="utf-8") as f:
        text = f.read()
    
    questions = extract_questions(text)
    print(f"[DEBUG] Number of questions detected: {len(questions)}")
    
    for q_idx, q_text in enumerate(questions, start=1):
        word_count = len(q_text.split())
        print(f"[DEBUG] Processing Question {q_idx}: Word count={word_count}")
        
        # --- Gemini Tokens ---
        start_time = time.time()
        gemini_tokens_text = count_tokens_gemini_text(q_text)
        gemini_text_time = round(time.time() - start_time, 3)
        


        image_part = Image.open(png_file) if png_file.exists() else None
        gemini_tokens_image = count_tokens_gemini(
            model="gemini-2.5-flash", 
            contents=["", image_part]
        ) if png_file.exists() else None
        gemini_image_time = round(time.time() - start_time, 3)

        
        
        # --- GPT Tokens ---
        start_time = time.time()
        gpt_tokens_text = count_tokens_gpt_text(q_text)
        gpt_text_time = round(time.time() - start_time, 3)
        
        start_time = time.time()
        gpt_tokens_image = count_tokens_gpt_text(q_text) if png_file.exists() else None
        gpt_image_time = round(time.time() - start_time, 3)
        
        # --- Debug print for tokens & time ---
        print(f"    [DEBUG] Gemini Tokens (Text): {gemini_tokens_text}, Time: {gemini_text_time}s")
        print(f"    [DEBUG] Gemini Tokens (Image): {gemini_tokens_image}, Time: {gemini_image_time}s")
        print(f"    [DEBUG] GPT Tokens (Text): {gpt_tokens_text}, Time: {gpt_text_time}s")
        print(f"    [DEBUG] GPT Tokens (Image): {gpt_tokens_image}, Time: {gpt_image_time}s")
        print(f"    [DEBUG] Image exists: {png_file.exists()}")
        
        # --- Save per-question file ---
        out_file = OUTPUT_DIR / f"{doc_id}_Q{q_idx}_tokens.txt"
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(f"Document: {doc_id}\nQuestion {q_idx}:\n{q_text}\n")
            f.write(f"Word Count: {word_count}\n")
            f.write(f"Gemini Tokens (Text): {gemini_tokens_text}, Time: {gemini_text_time}s\n")
            f.write(f"Gemini Tokens (Image): {gemini_tokens_image}, Time: {gemini_image_time}s\n")
            f.write(f"GPT Tokens (Text): {gpt_tokens_text}, Time: {gpt_text_time}s\n")
            f.write(f"GPT Tokens (Image): {gpt_tokens_image}, Time: {gpt_image_time}s\n")
            f.write(f"Image Present: {png_file.exists()}\n")
        print(f"    [DEBUG] Per-question output saved: {out_file.name}\n")
        
        # --- Append to CSV ---
        all_results.append([
            doc_id, f"Q{q_idx}", q_text, word_count,
            gemini_tokens_text, gemini_tokens_image,
            gpt_tokens_text, gpt_tokens_image,
            gemini_text_time, gemini_image_time
        ])

# --- Save summary CSV ---
csv_file = OUTPUT_DIR / "short_docs_questions_summary_debug.csv"
with open(csv_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow([
        "Document_ID","Question_ID","Question_Text","Word_Count",
        "Gemini_Tokens_Text","Gemini_Tokens_Image",
        "GPT_Tokens_Text","GPT_Tokens_Image",
        "Text_Response_Time","Image_Response_Time"
    ])
    writer.writerows(all_results)

print(f"[DEBUG] All questions processed. Summary CSV saved: {csv_file}")