import csv
import os
import json

# Paths
MOCK_DATA_DIR = "/Users/moshewiesenberg/.gemini/antigravity/scratch/dappledoc-pr-automation/mock_data"
PR_PLAN_PATH = os.path.join(MOCK_DATA_DIR, "pr_plan.csv")
TEMPLATES_PATH = os.path.join(MOCK_DATA_DIR, "email_templates.md")
GUIDANCE_PATH = os.path.join(MOCK_DATA_DIR, "messaging_guidance.md")

class PRAgentSuite:
    def __init__(self):
        self.plan = []
        self.templates = {}
        self.guidance = ""
        self._load_data()

    def _load_data(self):
        # Load PR Plan
        with open(PR_PLAN_PATH, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            self.plan = [row for row in reader]
        
        # Load Templates (Simple markdown parser)
        with open(TEMPLATES_PATH, mode='r', encoding='utf-8') as f:
            content = f.read()
            sections = content.split("## Template: ")[1:]
            for section in sections:
                title, body = section.split("\n", 1)
                self.templates[title.strip()] = body.strip()

        # Load Guidance
        with open(GUIDANCE_PATH, mode='r', encoding='utf-8') as f:
            self.guidance = f.read()

    # PoC 1: Spreadsheet -> Action Understanding
    def identify_pending_actions(self):
        print("\n--- PoC 1: Spreadsheet -> Action Understanding ---")
        actions = []
        for entry in self.plan:
            status = entry['Status'].lower()
            if status in ['pending', 'not started']:
                action = {
                    'journalists': entry['Journalist'],
                    'outlet': entry['Outlet'],
                    'action_type': 'outreach',
                    'draft_type': entry['Draft Type'],
                    'reason': f"Status is '{status}' and timing is '{entry['Suggested Timing']}'"
                }
                actions.append(action)
                print(f"[ACTION] Outreach needed for {entry['Journalist']} at {entry['Outlet']} ({entry['Draft Type']})")
        return actions

    # PoC 2: Email Draft Selection & Personalization
    def personalize_drafts(self, actions):
        print("\n--- PoC 2: Email Selection & Personalization ---")
        personalized_emails = []
        for action in actions:
            template_name = action['draft_type']
            template = self.templates.get(template_name, self.templates.get("Quick Pitch"))
            
            # Simple simulation of AI personalization
            # In a real Copilot agent, this would be a prompt: 
            # "Using the info for {{Journalist}} and {{ValueProp}} from guidance, fill this template"
            
            draft = template.replace("{{Journalist}}", action['journalists'])
            draft = draft.replace("{{Outlet}}", action['outlet'])
            
            # Simulate smarter personalization based on "Reason" or "Guidance"
            if "seed round" in action['reason'].lower() or "tech news" in template_name.lower():
                draft = draft.replace("{{ValueProp}}", "automate the seed-to-scale ops pipeline")
                draft = draft.replace("{{RecentTopic}}", "recent AI infrastructure trends")
            else:
                draft = draft.replace("{{ValueProp}}", "eliminate the manual 'spreadsheet-to-email' grind")
                draft = draft.replace("{{RecentTopic}}", "the challenges of scaling modern businesses")
                draft = draft.replace("{{RecentGuest}}", "the founders of high-growth startups")

            personalized_emails.append({
                'to': action['journalists'],
                'subject': draft.split("**Subject:**")[1].split("\n")[0].strip(),
                'body': draft.split("---")[-1].strip() if "---" in draft else draft
            })
            print(f"[PREPARED] Subject: {personalized_emails[-1]['subject']} (To: {action['journalists']})")
        
        return personalized_emails

if __name__ == "__main__":
    suite = PRAgentSuite()
    pending = suite.identify_pending_actions()
    drafts = suite.personalize_drafts(pending)
