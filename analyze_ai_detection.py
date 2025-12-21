import PyPDF2
from docx import Document
import re

def extract_pdf_text(pdf_path):
    """Extract text from PDF file"""
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def extract_docx_text(docx_path):
    """Extract text from DOCX file with paragraph structure"""
    doc = Document(docx_path)
    paragraphs = []
    for para in doc.paragraphs:
        if para.text.strip():
            paragraphs.append(para.text.strip())
    return paragraphs

def analyze_ai_detection(pdf_path, docx_path):
    """Analyze AI detection results and compare with document"""
    print("=" * 80)
    print("AI DETECTION ANALYSIS")
    print("=" * 80)
    
    # Extract PDF content
    print("\n1. Reading AI Detection Journal PDF...")
    pdf_text = extract_pdf_text(pdf_path)
    print(f"   PDF extracted: {len(pdf_text)} characters")
    
    # Save PDF text for review
    with open('ai_detection_results.txt', 'w', encoding='utf-8') as f:
        f.write(pdf_text)
    print("   Saved PDF content to: ai_detection_results.txt")
    
    # Extract DOCX content
    print("\n2. Reading Cross-Modal Tokenization Document...")
    paragraphs = extract_docx_text(docx_path)
    print(f"   Document has {len(paragraphs)} paragraphs")
    
    # Save document paragraphs
    with open('document_paragraphs.txt', 'w', encoding='utf-8') as f:
        for i, para in enumerate(paragraphs, 1):
            f.write(f"\n{'='*80}\n")
            f.write(f"PARAGRAPH {i}:\n")
            f.write(f"{'='*80}\n")
            f.write(para)
            f.write("\n")
    print("   Saved document paragraphs to: document_paragraphs.txt")
    
    # Look for AI detection indicators in PDF
    print("\n3. Analyzing AI Detection Results...")
    
    # Common AI detection indicators
    ai_indicators = [
        'AI-generated', 'AI generated', 'artificial intelligence',
        'detected', 'detection', 'probability', 'score',
        'human', 'fake', 'real', 'percentage', '%'
    ]
    
    # Search for detection results
    lines = pdf_text.split('\n')
    detection_info = []
    for i, line in enumerate(lines):
        for indicator in ai_indicators:
            if indicator.lower() in line.lower():
                detection_info.append(f"Line {i}: {line.strip()}")
                break
    
    print(f"   Found {len(detection_info)} lines with AI detection indicators")
    
    # Save detection info
    with open('detection_indicators.txt', 'w', encoding='utf-8') as f:
        for info in detection_info:
            f.write(info + '\n')
    print("   Saved detection indicators to: detection_indicators.txt")
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    print("\nGenerated files:")
    print("  - ai_detection_results.txt (full PDF content)")
    print("  - document_paragraphs.txt (all document paragraphs)")
    print("  - detection_indicators.txt (AI detection indicators)")
    print("\nPlease review these files to identify which paragraphs need rewriting.")

if __name__ == "__main__":
    pdf_path = r"researchpaper\jour (1) (1).pdf"
    docx_path = r"researchpaper\Cross-Modal Tokenization Economics-1 (1).docx"
    
    analyze_ai_detection(pdf_path, docx_path)
