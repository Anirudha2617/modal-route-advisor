import os
import csv
import time
import random
import signal
from pathlib import Path
from google import genai
from openai import OpenAI
import tiktoken
from PIL import Image

# ====================================================
# CONFIG
# ====================================================
API_KEY = "AIzaSyDk98kfYAR3nIg1zn0gRgjJRnlKNzS-scA" 
GEMINI_MODEL = "gemini-2.5-flash"
GPT_MODEL = "gpt-4o-mini"

DATASET_DIR = Path("./enterprise_multimodal_dataset_60/short_docs")
OUTPUT_DIR = Path("./short_docs_question_tokens_final")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ====================================================
# INIT CLIENTS
# ====================================================
try:
    gemini_client = genai.Client(api_key=API_KEY)
    print("[DEBUG] Gemini client initialized successfully.")
except Exception as e:
    print(f"[DEBUG] Gemini init error: {e}")
    gemini_client = None

try:
    openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("[DEBUG] OpenAI client initialized successfully.")
except Exception as e:
    print(f"[DEBUG] OpenAI client not initialized: {e}")
    openai_client = None


# ====================================================
# TOKEN HELPERS
# ====================================================
def get_gpt_tokenizer(model_name="gpt-4o"):
    try:
        return tiktoken.encoding_for_model(model_name)
    except Exception:
        return tiktoken.get_encoding("cl100k_base")


def count_tokens_gpt_text(text):
    if not text:
        return None
    try:
        enc = get_gpt_tokenizer(GPT_MODEL)
        return len(enc.encode(text))
    except Exception as e:
        print(f"[DEBUG] GPT token count error: {e}")
        return None


def estimate_image_tokens(image_path):
    if not image_path or not Path(image_path).exists():
        return None, (0, 0)
    try:
        with Image.open(image_path) as img:
            w, h = img.size
            tokens = max(256, min(max(w, h) // 4, 2048))
            return tokens, (w, h)
    except Exception as e:
        print(f"[DEBUG] Image token estimate error: {e}")
        return None, (0, 0)


# ====================================================
# TIMEOUT HANDLER
# ====================================================
class TimeoutError(Exception):
    pass


def timeout_handler(signum, frame):
    raise TimeoutError


# signal.signal(signal.SIGALRM, timeout_handler)


# ====================================================
# GEMINI SAFE CALL
# ====================================================
def safe_gemini_call(prompt=None, image_path=None, retries=3, timeout_sec=30):
    if gemini_client is None:
        return "N/A", None, None

    for attempt in range(1, retries + 1):
        try:
            signal.alarm(timeout_sec)
            start_t = time.time()

            # ---- Build structured content ----
            contents = []
            if prompt:
                contents = [{"role": "user", "parts": [{"text": prompt}]}]
            if image_path and Path(image_path).exists():
                with open(image_path, "rb") as f:
                    img_bytes = f.read()
                contents = [{
                    "role": "user",
                    "parts": [
                        {"text": "Analyze this image and summarize what it conveys."},
                        {"inline_data": {"mime_type": "image/png", "data": img_bytes}}
                    ]
                }]

            print("[DEBUG] Gemini generating...", end="", flush=True)
            response = gemini_client.models.generate_content(
                model=GEMINI_MODEL,
                contents=contents,
            )
            print(" done.")
            signal.alarm(0)

            end_t = time.time()
            # Extract response text safely
            resp_text = getattr(response, "text", None)
            if not resp_text:
                try:
                    if hasattr(response, "candidates") and response.candidates:
                        resp_text = response.candidates[0].content.parts[0].text
                    else:
                        resp_text = str(response)
                except Exception:
                    resp_text = str(response)

            resp_text = (resp_text or "").strip()
            out_tokens = count_tokens_gpt_text(resp_text)
            time.sleep(1.5 + random.uniform(0.2, 0.6))  # throttle
            return resp_text, out_tokens, round(end_t - start_t, 3)

        except TimeoutError:
            print(f"\n[DEBUG] Gemini timeout after {timeout_sec}s (attempt {attempt})")
            signal.alarm(0)
        except Exception as e:
            print(f"\n[DEBUG] Gemini error (attempt {attempt}): {e}")
        time.sleep(5 * attempt)
    return "N/A", None, None


# ====================================================
# GPT SAFE CALL
# ====================================================
def safe_gpt_call(prompt=None, image_path=None):
    if openai_client is None:
        return "N/A", None, None
    try:
        start_t = time.time()
        if image_path and Path(image_path).exists():
            messages = [{"role": "user", "content": "Describe what the image represents."}]
        else:
            messages = [{"role": "user", "content": prompt or ""}]

        response = openai_client.chat.completions.create(model=GPT_MODEL, messages=messages)
        end_t = time.time()

        resp_text = response.choices[0].message.content.strip()
        out_tokens = getattr(response.usage, "completion_tokens", count_tokens_gpt_text(resp_text))
        time.sleep(1.5 + random.uniform(0.2, 0.5))
        return resp_text, out_tokens, round(end_t - start_t, 3)

    except Exception as e:
        print(f"[DEBUG] GPT call error: {e}")
        return "N/A", None, None


# ====================================================
# QUESTION EXTRACTION
# ====================================================
def extract_questions(text):
    lines = text.splitlines()
    qs = [l.strip() for l in lines if l.strip().startswith(("Q", "Question", "RQ"))]
    return qs or [text.strip()]


# ====================================================
# MAIN LOOP
# ====================================================
txt_files = sorted(DATASET_DIR.glob("*.txt"))
print(f"[DEBUG] Total TXT files: {len(txt_files)}\n")

summary_rows = []

for idx, txt_file in enumerate(txt_files, start=1):
    doc_id = txt_file.stem
    png_file = txt_file.with_suffix(".png")

    print(f"[DEBUG] [{idx}] Processing {doc_id}")
    text = txt_file.read_text(encoding="utf-8")
    questions = extract_questions(text)

    for q_idx, q_text in enumerate(questions, start=1):
        print(f"[DEBUG] Q{q_idx}: {q_text[:80]}...")
        input_tokens_text = count_tokens_gpt_text(q_text)

        # ---- TEXT MODE ----
        gem_txt_resp, gem_txt_out, gem_txt_time = safe_gemini_call(prompt=q_text)
        gpt_txt_resp, gpt_txt_out, gpt_txt_time = safe_gpt_call(prompt=q_text)

        # ---- IMAGE MODE ----
        img_tokens, (w, h) = estimate_image_tokens(png_file)
        gem_img_resp, gem_img_out, gem_img_time = safe_gemini_call(image_path=str(png_file)) if png_file.exists() else ("N/A", None, None)
        gpt_img_resp, gpt_img_out, gpt_img_time = safe_gpt_call(image_path=str(png_file)) if png_file.exists() else ("N/A", None, None)

        # ---- TABLE ----
        def disp(x): return "N/A" if x is None else x
        table = []
        table.append("-" * 74)
        table.append("| Model  | Input Type | Input Tokens | Output Tokens | Time (s) | Response Snippet")
        table.append("-" * 74)
        rows = [
            ("Gemini", "Text", disp(input_tokens_text), disp(gem_txt_out), disp(gem_txt_time), (gem_txt_resp or "")[:50]),
            ("GPT", "Text", disp(input_tokens_text), disp(gpt_txt_out), disp(gpt_txt_time), (gpt_txt_resp or "")[:50]),
            ("Gemini", "Image", disp(img_tokens), disp(gem_img_out), disp(gem_img_time), (gem_img_resp or "")[:50]),
            ("GPT", "Image", disp(img_tokens), disp(gpt_img_out), disp(gpt_img_time), (gpt_img_resp or "")[:50]),
        ]
        for r in rows:
            table.append(f"| {r[0]:<6} | {r[1]:<9} | {str(r[2]):<12} | {str(r[3]):<13} | {str(r[4]):<7} | {r[5]}")
        table.append("-" * 74)

        # ---- SAVE PER QUESTION ----
        out_file = OUTPUT_DIR / f"{doc_id}_Q{q_idx}_tokens.txt"
        with out_file.open("w", encoding="utf-8") as f:
            f.write(f"Document: {doc_id}\nQuestion {q_idx}:\n{q_text}\n\n")
            f.write("\n".join(table))
            f.write("\n\nTEXT MODE RESPONSES\n\n")
            f.write("Gemini Response:\n" + (gem_txt_resp or "N/A") + "\n\n")
            f.write("GPT Response:\n" + (gpt_txt_resp or "N/A") + "\n\n")
            f.write("IMAGE MODE RESPONSES\n\n")
            f.write(f"Image Size: {w}x{h}\n\n")
            f.write("Gemini Response:\n" + (gem_img_resp or "N/A") + "\n\n")
            f.write("GPT Response:\n" + (gpt_img_resp or "N/A") + "\n\n")

        print(f"[DEBUG] Saved: {out_file.name}")

        # ---- APPEND CSV ROWS ----
        summary_rows += [
            [doc_id, f"Q{q_idx}", "Text", input_tokens_text, gem_txt_out, gem_txt_time, "Gemini", (gem_txt_resp or "")[:240]],
            [doc_id, f"Q{q_idx}", "Text", input_tokens_text, gpt_txt_out, gpt_txt_time, "GPT", (gpt_txt_resp or "")[:240]],
            [doc_id, f"Q{q_idx}", "Image", img_tokens, gem_img_out, gem_img_time, "Gemini", (gem_img_resp or "")[:240]],
            [doc_id, f"Q{q_idx}", "Image", img_tokens, gpt_img_out, gpt_img_time, "GPT", (gpt_img_resp or "")[:240]],
        ]

# ====================================================
# SAVE SUMMARY CSV
# ====================================================
csv_file = OUTPUT_DIR / "questions_summary_final.csv"
with csv_file.open("w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Document_ID", "Question_ID", "Input_Type",
                     "Input_Tokens", "Output_Tokens", "Response_Time",
                     "Model", "Response_Snippet"])
    writer.writerows(summary_rows)

print(f"\n✅ [DONE] All processed successfully. Summary saved: {csv_file}")
