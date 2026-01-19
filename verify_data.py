import csv
import json
import os

BASE_DIR = "/Users/moshewiesenberg/.gemini/antigravity/scratch/dappledoc-pr-automation/mock_data/pr_v1"

def verify_csv(filename):
    path = os.path.join(BASE_DIR, filename)
    print(f"Verifying {filename}...")
    with open(path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        count = 0
        for row in reader:
            count += 1
        print(f"  OK: {count} rows found.")

def verify_md_header(filename):
    path = os.path.join(BASE_DIR, filename)
    print(f"Verifying {filename} header...")
    with open(path, mode='r', encoding='utf-8') as f:
        content = f.read()
        if content.startswith("```json"):
            json_str = content.split("```json")[1].split("```")[0].strip()
            data = json.loads(json_str)
            print(f"  OK: JSON header found for doc_type '{data.get('doc_type')}'")
        else:
            print(f"  ERROR: No JSON header found in {filename}")

if __name__ == "__main__":
    verify_md_header("messaging_system.md")
    verify_md_header("strategy_plan.md")
    verify_md_header("pitch_bank.md")
    verify_md_header("press_release.md")
    verify_md_header("online_presence_checklist.md")
    verify_csv("media_list.csv")
    verify_csv("outreach_tracker.csv")
