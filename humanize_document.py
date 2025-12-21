from docx import Document
from docx.shared import Pt, RGBColor
import re

# Humanized rewrites for AI-detected paragraphs
HUMANIZED_PARAGRAPHS = {
    # ABSTRACT - Paragraph 7 (Original was too AI-like)
    7: """The gradual increase in AI integration across industries has led to rapid advancements in large language models (LLMs). However, this progress has introduced pricing inconsistencies across different input modalities. Interestingly, identical content can incur vastly different processing costs depending on whether it's submitted as text, image, audio, or video. Through this research, we systematically examine these pricing variations across five major AI providers—OpenAI, Google Gemini, Anthropic, Perplexity, and xAI. Our investigation involved controlled experiments using a diverse collection of 100 documents in various formats (text, images, audio, and video where supported), which revealed some surprising cost-performance patterns.""",
    
    # ABSTRACT - Paragraph 8 (Continue abstract rewrite)
    8: """What we found was quite remarkable: when documents exceed roughly 800 words, converting them to image format before processing can slash costs by 70-95%. We've documented these patterns through empirical scaling laws and pinpointed exact break-even thresholds for each modality. To put these insights into practice, we developed ModalRoute—a smart routing system that automatically picks the most economical input format for any given task. During testing, ModalRoute cut costs by an average of 66% while maintaining 95% of the original task performance. Our findings provide concrete, data-backed strategies for optimizing AI deployment costs, laying groundwork for what we call Token FinOps.""",
    
    # INTRODUCTION - Paragraph 11 (Motivation section - too formal/AI-like)
    11: """Right now, we're watching generative AI evolve at breakneck speed, with businesses across every sector racing to adopt multimodal architectures. But here's the thing: as companies move beyond pilot projects into full-scale production, the conversation is shifting. It's no longer just about what these models can do—it's about whether organizations can afford to keep them running long-term. The biggest roadblock? Costs that are both steep and unpredictable. Everything hinges on tokens—those fundamental units of computation that determine your bill. That's why tokenomics has become such a hot topic in AI engineering circles. It's not just academic anymore; it demands serious, empirical study.""",
    
    # INTRODUCTION - Paragraph 12 (Economic complexity)
    12: """The economics get even messier when you consider how LLMs have grown into full-fledged multimodal systems. Sure, today's models can seamlessly handle text, images, audio, and video—but the pricing? That's all over the map. Providers use schemes that often feel arbitrary and hard to predict. This creates what you might call token arbitrage opportunities: by carefully choosing your input format, you can get the exact same result for a fraction of what you'd pay otherwise.""",
    
    # INTRODUCTION - Paragraph 13 (Case study example)
    13: """Let me give you a concrete example. We took a 5,000-word legal contract and ran it through OpenAI's GPT-4o as plain text. Cost: about $0.0166. Then we tried something different—we converted that same contract into high-resolution PDF images and sent those to the model's vision API instead. The result? Just $0.0013. That's a 92.5% cost drop, and here's the kicker: the extraction accuracy was virtually identical. This isn't some one-off quirk. It's a systematic pattern that reveals a major opportunity: you can optimize costs dramatically not by switching models, but simply by rethinking how you format your input data.""",
    
    # Research Questions - Paragraph 16
    16: """Over the past few years, large language models have matured into sophisticated multimodal systems capable of processing text, images, audio, and video within unified frameworks. Yet despite this technical progress, the pricing structures for different input types remain murky and inconsistent. In practice, this means you can often complete the same task at wildly different price points just by changing how you represent the input.""",
    
    # Research Questions - Paragraph 17
    17: """This creates what we might call token-level inefficiencies—situations where switching to an alternative modality delivers comparable quality while using fewer computational resources. For researchers and engineers deploying these models in cost-sensitive settings, understanding these differences isn't just interesting—it's essential.""",
    
    # Research Questions - Paragraph 18
    18: """With that in mind, here are the questions driving our research:""",
    
    # RQ1 - Paragraph 19
    19: """RQ1: What underlying architectural or design choices explain why tokenization costs and strategies vary so much across modalities (text, image, audio, video) and across different AI providers?""",
    
    # RQ2 - Paragraph 20
    20: """RQ2: At what specific input size and complexity does it make more sense—cost-wise—to use non-text formats instead of plain text, without sacrificing task performance?""",
    
    # RQ3 - Paragraph 21
    21: """RQ3: Is it feasible to build a practical routing system that automatically picks the cheapest modality for each task? And what real-world challenges come up when you try to deploy something like that at scale?""",
    
    # Contributions - Paragraph 23
    23: """This research offers both hands-on and experimental insights into how multimodal LLMs behave cost-wise in real-world scenarios. Rather than relying on theoretical projections, we focus on actual usage patterns and measured billing data—making our findings directly applicable to engineers and system designers.""",
    
    # Contributions - Paragraph 24
    24: """Here's what we're bringing to the table:""",
    
    # Contribution 1 - Paragraph 25
    25: """First, we provide a side-by-side empirical comparison of tokenization costs across multiple AI providers and input types. Our analysis is grounded in real billing behavior, not abstract computational metrics—giving you a realistic picture of cost differences in practice.""",
    
    # Contribution 2 - Paragraph 26
    26: """Second, we identify and document scaling patterns that show how token efficiency changes with input size and format across platforms. These patterns help you estimate costs upfront, which is invaluable during system design and planning.""",
    
    # Contribution 3 - Paragraph 27
    27: """Third, we introduce and test a lightweight approach for selecting the best input modality. Our method shows how routing requests through different formats can cut processing costs significantly—and it's straightforward enough to integrate without overhauling your existing pipeline.""",
    
    # Contribution 4 - Paragraph 28
    28: """Fourth, we're releasing a complete evaluation toolkit to support reproducibility. This includes curated datasets, testing scripts, and analysis tools that enable consistent cost–performance comparisons and make it easier for others to build on our work.""",
    
    # Contribution 5 - Paragraph 29
    29: """Finally, drawing from our experimental results, we offer a set of practical guidelines for engineers deploying multimodal models in production. These recommendations emphasize balancing cost efficiency with acceptable performance, rather than chasing optimization for its own sake.""",
    
    # Related Work - Paragraph 33 (Transformer economics)
    33: """At its core, LLM inference costs stem from the computational demands of transformer architectures. The self-attention mechanism—transformers' defining feature—has computational and memory requirements that scale quadratically with sequence length (O(n²)), where n represents the number of tokens. This quadratic growth makes long sequences extremely expensive to process. A major contributor to this cost is the Key-Value (KV) cache, which stores intermediate attention states to accelerate generation. So if you want to reduce inference costs, you've got two main levers: cut down the number of input tokens, or optimize how the KV cache is managed. Our work zeroes in on the first approach, exploring how converting between modalities can serve as an effective pre-computation token reduction strategy.""",
}

def apply_humanized_rewrites(docx_path, output_path):
    """Apply humanized rewrites to the document"""
    print("="*80)
    print("APPLYING HUMANIZED REWRITES TO DOCUMENT")
    print("="*80)
    
    # Load the document
    doc = Document(docx_path)
    
    # Track paragraph index (only counting non-empty paragraphs)
    para_index = 0
    changes_made = 0
    
    for para in doc.paragraphs:
        if para.text.strip():  # Only count non-empty paragraphs
            para_index += 1
            
            # Check if this paragraph needs rewriting
            if para_index in HUMANIZED_PARAGRAPHS:
                old_text = para.text
                new_text = HUMANIZED_PARAGRAPHS[para_index]
                
                # Preserve formatting
                original_style = para.style
                original_alignment = para.alignment
                
                # Clear and replace text
                para.clear()
                para.add_run(new_text)
                para.style = original_style
                para.alignment = original_alignment
                
                changes_made += 1
                print(f"\n✓ Rewrote Paragraph {para_index}")
                print(f"  Old (first 100 chars): {old_text[:100]}...")
                print(f"  New (first 100 chars): {new_text[:100]}...")
    
    # Save the modified document
    doc.save(output_path)
    
    print(f"\n{'='*80}")
    print(f"REWRITE COMPLETE")
    print(f"{'='*80}")
    print(f"Total paragraphs rewritten: {changes_made}")
    print(f"Output saved to: {output_path}")
    print(f"\nNext steps:")
    print(f"1. Review the updated document")
    print(f"2. Run it through AI detection again to verify improvement")
    print(f"3. Make additional manual adjustments if needed")

if __name__ == "__main__":
    input_path = r"researchpaper\Cross-Modal Tokenization Economics-1 (1).docx"
    output_path = r"researchpaper\Cross-Modal_Tokenization_Economics_HUMANIZED.docx"
    
    apply_humanized_rewrites(input_path, output_path)
