import csv
import os
import json

# Paths
MOCK_DATA_DIR = "/Users/moshewiesenberg/.gemini/antigravity/scratch/dappledoc-pr-automation/mock_data/pr_v1"
PR_PLAN_PATH = os.path.join(MOCK_DATA_DIR, "media_list.csv")
TEMPLATES_PATH = os.path.join(MOCK_DATA_DIR, "pitch_bank.md")
GUIDANCE_PATH = os.path.join(MOCK_DATA_DIR, "messaging_system.md")

class PRAgentSuite:
    def __init__(self):
        self.plan = []
        self.templates = {}
        self.guidance = ""
        self._load_data()

    def _strip_json_header(self, content):
        if content.startswith("```json"):
            return content.split("```", 2)[2].strip()
        return content

    def _load_data(self):
        # Load PR Plan (Media List)
        with open(PR_PLAN_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.plan = [row for row in reader]
        
        # Load Templates (Simple markdown parser)
        with open(TEMPLATES_PATH, mode='r', encoding='utf-8') as f:
            content = self._strip_json_header(f.read())
            sections = content.split("## Template: ")[1:]
            for section in sections:
                title, body = section.split("\n", 1)
                self.templates[title.strip()] = body.strip()

        # Load Guidance
        with open(GUIDANCE_PATH, mode='r', encoding='utf-8') as f:
            self.guidance = self._strip_json_header(f.read())

    # PoC 1: Spreadsheet -> Action Understanding
    def identify_pending_actions(self):
        print("\n--- PoC 1: Spreadsheet -> Action Understanding ---")
        actions = []
        for entry in self.plan:
            status = entry['contact_status'].lower()
            if status in ['not_contacted', 'pending']:
                action = {
                    'reporter_name': entry['reporter_name'],
                    'outlet': entry['outlet'],
                    'action_type': 'outreach',
                    'angle_fit': entry['angle_fit'],
                    'priority': entry['priority'],
                    'reason': f"Status is '{status}' and priority is '{entry['priority']}'"
                }
                actions.append(action)
                print(f"[ACTION] Outreach needed for {entry['reporter_name']} at {entry['outlet']} (Angle: {entry['angle_fit']})")
        return actions

    # PoC 2: Email Draft Selection & Personalization
    def personalize_drafts(self, actions):
        print("\n--- PoC 2: Email Selection & Personalization ---")
        personalized_emails = []
        for action in actions:
            # Use the first prescribed angle
            template_name = action['angle_fit'].split(';')[0].strip()
            template = self.templates.get(template_name, self.templates.get("Trend"))
            
            # Simple simulation of AI personalization
            draft = template.replace("{{Journalist}}", action['reporter_name'])
            draft = draft.replace("{{Outlet}}", action['outlet'])
            
            # Simulate smarter personalization
            if "Founder story" in action['angle_fit']:
                draft = draft.replace("{{ValueProp}}", "automate the seed-to-scale ops pipeline")
                draft = draft.replace("{{RecentTopic}}", "recent AI infrastructure trends")
            else:
                draft = draft.replace("{{ValueProp}}", "eliminate the manual 'spreadsheet-to-email' grind")
                draft = draft.replace("{{RecentTopic}}", "the challenges of scaling modern businesses")

            personalized_emails.append({
                'to': action['reporter_name'],
                'subject': draft.split("**Subject:**")[1].split("\n")[0].strip() if "**Subject:**" in draft else "No Subject",
                'body': draft.split("---")[-1].strip() if "---" in draft else draft
            })
            print(f"[PREPARED] Subject: {personalized_emails[-1]['subject']} (To: {action['reporter_name']})")
        
        return personalized_emails

if __name__ == "__main__":
    suite = PRAgentSuite()
    pending = suite.identify_pending_actions()
    drafts = suite.personalize_drafts(pending)
