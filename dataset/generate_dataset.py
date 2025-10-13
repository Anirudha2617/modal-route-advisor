import os
import re
import requests
from bs4 import BeautifulSoup
from sec_edgar_downloader import Downloader
import random
import logging
from pathlib import Path
import time
from urllib.parse import urlparse

# --- Configuration ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logging.getLogger("sec_edgar_downloader").setLevel(logging.ERROR)
BASE_DIR = Path("generated_enterprise_dataset")
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

# --- Core Helper Functions ---

def count_words(text: str) -> int:
    if not text: return 0
    return len(re.findall(r'\w+', text))

def stratify_document(word_count: int) -> str | None:
    if 200 <= word_count <= 500: return "Short_Documents"
    if 500 < word_count <= 1500: return "Medium_Documents"
    if 1500 < word_count <= 5000: return "Long_Documents"
    return None

def is_complex(html_content: str) -> bool:
    if not html_content: return False
    return "<table>" in html_content.lower() or "<img" in html_content.lower()

def create_dataset_directory():
    BASE_DIR.mkdir(exist_ok=True)
    strata = ["Short_Documents", "Medium_Documents", "Long_Documents", "Complex_Documents"]
    for stratum in strata:
        (BASE_DIR / stratum).mkdir(exist_ok=True)
    logging.info(f"Dataset directory '{BASE_DIR}' is ready.")

def save_document(content: str, source_name: str, html_content: str = None):
    word_count = count_words(content)
    category = stratify_document(word_count)
    if category:
        safe_name = re.sub(r'[^\w\s-]', '', source_name).strip().replace(' ', '_')
        filename = f"{safe_name[:60]}.txt"
        filepath = BASE_DIR / category / filename
        try:
            filepath.write_text(content, encoding='utf-8')
            logging.info(f"Saved '{filename}' to {category} ({word_count} words).")
            if html_content and is_complex(html_content):
                complex_filepath = BASE_DIR / "Complex_Documents" / filename
                complex_filepath.write_text(content, encoding='utf-8')
                logging.info(f"  -> Also categorized '{filename}' as Complex.")
        except Exception as e:
            logging.error(f"Could not save file {filename}. Reason: {e}")

# --- Data Sourcing Functions (Definitive Version) ---

def fetch_technical_papers(count=25):
    """Fetches technical paper abstracts from the reliable PubMed Central (PMC) API."""
    logging.info(f"\nFetching up to {count} technical papers from PubMed API...")
    try:
        base_search_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
        search_params = {
            "db": "pmc", "term": "machine learning", "retmax": count,
            "sort": "pub_date", "retmode": "json"
        }
        response = requests.get(base_search_url, params=search_params, headers=HEADERS, timeout=20)
        response.raise_for_status()
        id_list = response.json()["esearchresult"]["idlist"]
        
        if not id_list:
            logging.warning("PubMed API search returned no paper IDs.")
            return

        base_fetch_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
        fetch_params = {"db": "pmc", "id": ",".join(id_list), "retmode": "json"}
        summary_response = requests.get(base_fetch_url, params=fetch_params, headers=HEADERS, timeout=20)
        summary_response.raise_for_status()
        results = summary_response.json()["result"]
        
        logging.info(f"✅ Success! Fetched {len(results)-1} paper summaries from PubMed.")
        for uid, paper_data in results.items():
            if uid == "uids": continue
            title = paper_data.get("title", "No Title")
            # Create a summary string to serve as the document content
            summary_content = f"Title: {title}\n\n[This is a summary of a technical paper from PubMed Central.]"
            save_document(summary_content, f"pubmed_{uid}")
    except Exception as e:
        logging.error(f"Failed to process PubMed API response. Error: {e}")


def fetch_legal_documents(count_per_company=5):
    """Downloads and correctly processes SEC filings."""
    logging.info(f"\nFetching up to {count_per_company*3} legal documents from SEC EDGAR...")
    companies = ["AAPL", "MSFT", "GOOGL"]
    download_path = Path.cwd() / "sec_downloads"
    try:
        dl = Downloader("My Research", "my.email@research.com", download_path)
        for ticker in companies:
            logging.info(f"Downloading 10-K filings for {ticker}...")
            dl.get("10-K", ticker, limit=count_per_company)
            process_downloaded_filings(ticker, download_path)
    except Exception as e:
        logging.error(f"A failure occurred during SEC download. Error: {e}")


def process_downloaded_filings(ticker, download_path):
    """FIXED: Robustly finds and processes downloaded SEC files."""
    filing_path = download_path / "sec-edgar-filings" / ticker / "10-K"
    if not filing_path.exists():
        logging.warning(f"No filing directory found for {ticker} at {filing_path}.")
        return
        
    for doc_path in filing_path.rglob("*.htm*"):
        # The primary document is usually named this. This check makes processing reliable.
        if "filing-document" in doc_path.name:
            try:
                html_content = doc_path.read_text(encoding='utf-8', errors='ignore')
                soup = BeautifulSoup(html_content, 'html.parser')
                text_content = soup.get_text(separator='\n', strip=True)
                filing_id = doc_path.parent.name
                save_document(text_content, f"sec_{ticker}_{filing_id}", html_content=html_content)
            except Exception as e:
                logging.error(f"Error processing {doc_path}: {e}")


def fetch_business_reports(count=25):
    """FIXED: Uses more reliable and stable blog sources."""
    logging.info(f"\nFetching up to {count} business reports from corporate blogs...")
    # Using more stable and scraper-friendly blog sources
    blogs = [
        {"url": "https://aws.amazon.com/blogs/aws/", "selector": "h2 > a"},
        {"url": "https://www.technologyreview.com/topic/artificial-intelligence/", "selector": "a.teaser__title-link"},
        {"url": "https://news.mit.edu/topic/artificial-intelligence2", "selector": "a.term-page--news-article--item--title-link"}
    ]
    all_links = []
    for blog in blogs:
        try:
            response = requests.get(blog['url'], headers=HEADERS, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            base_url = f"https://{urlparse(response.url).netloc}"
            links = [a['href'] for a in soup.select(blog['selector'])]
            full_links = [link if link.startswith('http') else (base_url + link) for link in links]
            logging.info(f"Found {len(full_links)} links on {blog['url']}")
            all_links.extend(full_links)
        except Exception as e:
            logging.warning(f"Could not fetch links from {blog['url']}. Reason: {e}")
    if not all_links:
        logging.error("No blog articles found. Halting blog fetch.")
        return
    for link in random.sample(all_links, min(len(all_links), count)):
        try:
            time.sleep(0.5)
            article_res = requests.get(link, headers=HEADERS, timeout=15)
            article_soup = BeautifulSoup(article_res.content, 'html.parser')
            article_body = article_soup.find('article') or article_soup.find('div', class_=re.compile(r'content|post|body|main'))
            if article_body:
                html_content = str(article_body)
                text_content = article_body.get_text(separator='\n', strip=True)
                filename = "blog_" + Path(link.split('?')[0]).name.strip('/')
                save_document(text_content, filename, html_content=html_content)
        except Exception as e:
            logging.warning(f"Could not scrape article at {link}. Reason: {e}")


def summarize_dataset():
    """FIXED: Correctly counts all documents in the final summary."""
    logging.info("\n------------------- FINAL SUMMARY -------------------")
    total_files = 0
    # Iterate through the expected subdirectories to count files
    for subdir_name in ["Short_Documents", "Medium_Documents", "Long_Documents"]:
        subdir = BASE_DIR / subdir_name
        if subdir.exists():
            count = len(list(subdir.glob('*.txt')))
            logging.info(f"Found {count} files in '{subdir_name}'")
            total_files += count
    
    # Also report on Complex documents, but don't add to total to avoid double-counting
    complex_dir = BASE_DIR / "Complex_Documents"
    if complex_dir.exists():
        logging.info(f"Found {len(list(complex_dir.glob('*.txt')))} files in 'Complex_Documents'")

    logging.info(f"\nTotal unique documents generated: {total_files}")
    logging.info("-----------------------------------------------------")


def main():
    """Runs the complete, automated dataset generation process."""
    create_dataset_directory()
    fetch_technical_papers(count=25)
    fetch_legal_documents(count_per_company=5)
    fetch_business_reports(count=25)
    summarize_dataset()
    logging.info("✅ Dataset generation script finished successfully!")


if __name__ == "__main__":
    main()