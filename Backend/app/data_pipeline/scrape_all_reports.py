import os
import sys
import re
import time
from curl_cffi import requests
from bs4 import BeautifulSoup

# Add the Backend directory to the sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.core.config import settings

def clean_report_text(text: str) -> str:
    """Clean boilerplate text from the crawled report."""
    # Split text into lines
    lines = text.split("\n")
    cleaned_lines = []
    
    # We want to skip lines that are typical Cricinfo tags or related article recommendations
    skip_patterns = [
        r"^Report$",
        r"^Related$",
        r"^Published:",
        r"^Danyal Rasool is ESPNcricinfo's Pakistan correspondent",
        r"^[a-zA-Z\s]+ is ESPNcricinfo's",
    ]
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
            
        # Check if line matches any skip pattern
        should_skip = False
        for pattern in skip_patterns:
            if re.search(pattern, line_stripped, re.IGNORECASE):
                should_skip = True
                break
        
        # Also skip single words/names that are just tag lists at the bottom of the article
        # Usually these are short lines with player names (e.g. "Fakhar Zaman", "Saim Ayub")
        # that appear after the author description. We'll clean them up.
        if should_skip:
            continue
            
        cleaned_lines.append(line_stripped)
        
    return "\n\n".join(cleaned_lines)

def parse_scratchpad_matches(scratchpad_path: str):
    """Parses match listings and report URLs from the browser scratchpad."""
    matches = []
    
    if not os.path.exists(scratchpad_path):
        print(f"Error: Scratchpad file not found at {scratchpad_path}")
        return matches
        
    with open(scratchpad_path, "r") as f:
        content = f.read()
        
    # Regex to find match listings:
    # 1. Match item like: "1. Lahore Qalandars vs Hyderabad Kingsmen (1st Match)"
    # 2. Report link: "Report: /series/..." or "(No report link on page)"
    # Let's parse them using lines and state
    lines = content.split("\n")
    current_match = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Match pattern: e.g. "1. Lahore Qalandars vs Hyderabad Kingsmen (1st Match)"
        # or "Qualifier. Islamabad United vs Peshawar Zalmi"
        # or "Eliminator 1. Hyderabad Kingsmen vs Multan Sultans"
        match_header = re.match(r"^(\d+|Qualifier|Eliminator 1|Eliminator 2|Final)\.\s*(.*)", line)
        if match_header:
            match_num = match_header.group(1)
            match_name = match_header.group(2)
            current_match = {
                "number": match_num,
                "name": match_name,
                "report_url": None
            }
            matches.append(current_match)
            continue
            
        # Report pattern: e.g. "- Report: /series/..."
        if current_match and "Report:" in line:
            url_match = re.search(r"Report:\s*(\/series\/\S+)", line)
            if url_match:
                current_match["report_url"] = url_match.group(1)
            else:
                current_match["report_url"] = None
                
    return matches

def scrape_all_reports():
    scratchpad_path = "/Users/mwahajkhalil/.gemini/antigravity-ide/brain/3b9a24f9-00cb-4af6-9615-53a45861f66a/browser/scratchpad_6l27x7wm.md"
    reports_dir = os.path.abspath(settings.REPORTS_DIR)
    os.makedirs(reports_dir, exist_ok=True)
    
    print("Parsing matches list from scratchpad...")
    matches = parse_scratchpad_matches(scratchpad_path)
    print(f"Parsed {len(matches)} matches.")
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    scraped_count = 0
    skipped_count = 0
    
    for i, match in enumerate(matches):
        match_num = match["number"]
        match_name = match["name"]
        url_path = match["report_url"]
        
        if not url_path:
            print(f"Skipping Match {match_num} ({match_name}) - No report link.")
            skipped_count += 1
            continue
            
        # Formulate filename
        # Group stage: 2026_match_01_report.txt, etc.
        # Play-offs: 2026_qualifier_report.txt, etc.
        if match_num.isdigit():
            filename = f"2026_match_{int(match_num):02d}_report.txt"
        else:
            filename = f"2026_{match_num.lower().replace(' ', '_')}_report.txt"
            
        filepath = os.path.join(reports_dir, filename)
        
        # Check if already exists and is not empty
        if os.path.exists(filepath) and os.path.getsize(filepath) > 200:
            print(f"File {filename} already exists. Skipping crawl.")
            scraped_count += 1
            continue
            
        url = "https://www.espncricinfo.com" + url_path
        print(f"[{i+1}/{len(matches)}] Fetching: {match_name} ({match_num}) from {url}...")
        
        try:
            response = requests.get(url, headers=headers, impersonate="chrome")
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, "html.parser")
                article = soup.find("article")
                if article:
                    raw_text = article.get_text(separator="\n")
                    cleaned_text = clean_report_text(raw_text)
                    
                    # Prepend metadata header
                    report_content = (
                        f"Match Report: PSL 2026 {match_num} - {match_name}\n"
                        f"Source URL: {url}\n\n"
                        f"{cleaned_text}"
                    )
                    
                    with open(filepath, "w") as f:
                        f.write(report_content)
                    print(f"  Saved to {filename} ({len(report_content)} bytes)")
                    scraped_count += 1
                else:
                    print(f"  Error: Could not find article tag in page content for {filename}.")
            else:
                print(f"  Error: Failed to fetch with status code {response.status_code}.")
        except Exception as e:
            print(f"  Exception occurred: {e}")
            
        # Sleep to avoid hitting Cricinfo rate limits too aggressively
        time.sleep(1.5)
        
    print(f"\nScrape job complete! Total reports scraped/verified: {scraped_count}, skipped: {skipped_count}")

if __name__ == "__main__":
    scrape_all_reports()
