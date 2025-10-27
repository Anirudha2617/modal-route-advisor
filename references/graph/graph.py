import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

# OpenAI GPT-4o
openai_text_cost_1000_words = 0.0033
openai_image_cost_1000_words = 0.00017
openai_break_even_words = 195

# Google Gemini 2.0 Flash
google_text_cost_1000_words = 0.0025
google_image_cost_1000_words = 0.00008
google_break_even_words = 83

# Anthropic Claude 3.5 Sonnet
anthropic_text_cost_1000_words = 0.0030
anthropic_image_cost_1000_words = 0.00039
anthropic_break_even_words = 288


def model_cost(words, cost_at_1000, break_even_point, type='text'):
    """
    Creates a cost model based on the paper's data points.
    - Text is modeled as linear (cost = words * rate).
    - Image is modeled with a fixed cost + sub-linear scaling to hit the known data points.
    """
    if type == 'text':
        rate = cost_at_1000 / 1000
        return words * rate
    else: 
        text_rate = (cost_at_1000 / (1000 / break_even_point)) / break_even_point 
        break_even_cost = text_rate * break_even_point

        A = np.array([[1, np.sqrt(break_even_point)], [1, np.sqrt(1000)]])
        b = np.array([break_even_cost, cost_at_1000])
        try:
            fixed_cost, rate = np.linalg.solve(A, b)
        except np.linalg.LinAlgError: 
            return np.full_like(words, cost_at_1000)

        return fixed_cost + rate * np.sqrt(words)

doc_length_words = np.linspace(1, 1500, 500)

# OpenAI
cost_text_openai = model_cost(doc_length_words, openai_text_cost_1000_words, openai_break_even_words, 'text')
cost_image_openai = model_cost(doc_length_words, openai_image_cost_1000_words, openai_break_even_words, 'image')

# Google (The paper notes Gemini's image token cost is fixed, so we'll model that)
cost_text_google = model_cost(doc_length_words, google_text_cost_1000_words, google_break_even_words, 'text')
cost_image_google = np.full_like(doc_length_words, google_image_cost_1000_words) 

# Anthropic
cost_text_anthropic = model_cost(doc_length_words, anthropic_text_cost_1000_words, anthropic_break_even_words, 'text')
cost_image_anthropic = model_cost(doc_length_words, anthropic_image_cost_1000_words, anthropic_break_even_words, 'image')

plt.style.use('seaborn-v0_8-whitegrid')
fig, ax = plt.subplots(figsize=(14, 8))

# Define colors for each provider
openai_color = '#10A37F'
google_color = '#4285F4'
anthropic_color = '#D9663A'

# Plot OpenAI data
ax.plot(doc_length_words, cost_text_openai, color=openai_color, linestyle='-', label='OpenAI GPT-4o (Text)')
ax.plot(doc_length_words, cost_image_openai, color=openai_color, linestyle='--', label='OpenAI GPT-4o (Image)')

# Plot Google data
ax.plot(doc_length_words, cost_text_google, color=google_color, linestyle='-', label='Google Gemini Flash (Text)')
ax.plot(doc_length_words, cost_image_google, color=google_color, linestyle='--', label='Google Gemini Flash (Image)')

# Plot Anthropic data
ax.plot(doc_length_words, cost_text_anthropic, color=anthropic_color, linestyle='-', label='Anthropic Claude 3.5 (Text)')
ax.plot(doc_length_words, cost_image_anthropic, color=anthropic_color, linestyle='--', label='Anthropic Claude 3.5 (Image)')

break_even_points = {
    "Google (83 words)": (google_break_even_words, model_cost(google_break_even_words, google_text_cost_1000_words, google_break_even_words, 'text')),
    "OpenAI (195 words)": (openai_break_even_words, model_cost(openai_break_even_words, openai_text_cost_1000_words, openai_break_even_words, 'text')),
    "Anthropic (288 words)": (anthropic_break_even_words, model_cost(anthropic_break_even_words, anthropic_text_cost_1000_words, anthropic_break_even_words, 'text'))
}

# Add markers and text
for label, (x, y) in break_even_points.items():
    ax.plot(x, y, 'o', markersize=8, zorder=10)
    ax.text(x + 50, y, label, fontsize=11, verticalalignment='center',
            bbox=dict(facecolor='white', alpha=0.7, edgecolor='none', pad=2))

ax.set_title('Cross-Modal LLM Cost Analysis', fontsize=18, fontweight='bold', pad=20)
ax.set_xlabel('Document Length (Number of Words)', fontsize=12)
ax.set_ylabel('Input Processing Cost (USD)', fontsize=12)

formatter = mticker.FormatStrFormatter('$%.4f')
ax.yaxis.set_major_formatter(formatter)

ax.legend(title='Provider and Modality', fontsize=11)
ax.set_xlim(0, 1500)
ax.set_ylim(0)

takeaway_text = (
    "Key Finding:\n"
    "Processing documents as images becomes significantly cheaper than text\n"
    "after a certain word count (the 'break-even point').\n"
    "This threshold varies significantly by provider."
)
ax.text(0.95, 0.6, takeaway_text, transform=ax.transAxes, fontsize=12,
        verticalalignment='center', horizontalalignment='right',
        bbox=dict(boxstyle='round,pad=0.5', fc='aliceblue', ec='grey', lw=1))


plt.tight_layout()
plt.show()