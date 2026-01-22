# Agent Architecture: Roles, Triggers, and Logic

This guide explains how the prototypes you've seen translate into real-world AI agents in your M365 environment.

## 1. One Agent or Many?
In this prototype, I've designed **one Master Agent** that can handle multiple specialized tasks. However, in a production system (like Copilot Studio), you would typically use:
- **Child Agents**: Small, focused agents for specific tasks (e.g., "The Scheduler", "The Personalizer").
- **Master Orchestrator**: A single entry point that understands the user's request and calls the correct Child Agent.

## 2. What Each Part Does (The PoCs)
| Component | Real-World Role | Trigger (Manual/Auto) |
| :--- | :--- | :--- |
| **Plan Scanner** (PoC 1) | Reads your Excel PR Plan. | **Manual**: You ask "What's next on the PR plan?"<br>**Scheduled**: Every Monday at 9 AM. |
| **Personalizer** (PoC 2) | Combines Journalist data + Messaging Guidance. | **Event**: Triggered immediately after the Scan finds a 'Pending' row. |
| **Email Executor** (PoC 3) | Prepares or Sends the email. | **Approval**: Agent sends you a Teams notification: "Ready to send?" |
| **Inbox Monitor** (PoC 4) | Watches your Outlook Inbox. | **Automatic**: Triggered by "When a new email arrives." |
| **Scheduler** (PoC 5) | Checks Calendar & sends invites. | **Contextual**: Triggered when the Monitor detects "Scheduling" intent. |

## 3. Triggers: How the Agent Knows to Work
In the real world, "Triggers" are the sparks that start the automation.
- **Excel Trigger**: The agent monitors a specific column (e.g., `Status`). When you change a row to "Approved", the agent automatically begins the personalization.
- **Outlook Trigger**: Power Automate (the engine under Copilot) "listens" to your inbox. When a reply comes in, it passes the text to the Agent for analysis.
- **Teams Trigger**: You can simply chat with the agent in Teams and say "Hey, check for interested replies from yesterday."

## 4. What You Will Need to Set Up
To turn this prototype into a reality, you would use:
1. **Copilot Studio**: Where you define the "personality" and prompt (e.g., "Use this guidance to draft an email").
2. **Power Automate**: The "pipes" that connect Excel to Outlook (e.g., "If Row X changes, send Email Y").
3. **Connectors**: Standard M365 permissions that allow the agent to read your files.

---

### Where is the dashboard?
The "Dashboard" I mentioned is a **local file** on your machine. You can open it right now by copying this path into your browser (Chrome/Safari/Edge):
`file:///Users/moshewiesenberg/.gemini/antigravity/scratch/dappledoc-pr-automation/prototypes/index.html`

It acts as a visual simulation of what happens "under the hood" of these agents.
