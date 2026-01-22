# PR Automation Findings: DappleDoc Internship

This document captures the technical and operational findings from building the PR AI Agent prototypes.

## What Worked Well
1.  **Spreadsheet Parsing**: Large Language Models (LLMs) are exceptionally good at understanding structure in messy CSV/Excel data. Identifying "Pending" vs. "Sent" status is a 100% reliable task for an agent.
2.  **Contextual Personalization**: By feeding the agent "Messaging Guidance" alongside journalist info, we successfully generated drafts that don't look like spam. This "Last Mile" of personalization is where the most time is saved.
3.  **Intent Detection**: Distinguishing between an "Interested" reply and an "Out of Office" response is a clear win for AI, reducing inbox noise for the humans on the team.

## Where AI Struggled / Challenges
1.  **System Integration**: Standard Copilot Studio agents require "Connectors" to talk to Excel and Outlook. Configuring these can be cumbersome compared to writing simple logic.
2.  **Token Limits**: If messaging guidance is too long (e.g., 50+ pages), the agent might lose focus on the specific draft style required.
3.  **Scheduling Logic**: While AI can *propose* times, the actual "Calendar invite dance" is best handled by APIs to avoid double-booking, which the agent logic needs to call specifically.

## Key Recommendations for DappleDoc
-   **Human-in-the-loop**: For the first 3 months, use the "Execution" agent to save drafts to the **Outlook Drafts folder** rather than sending directly. This allows a quick 5-second human review for brand safety.
-   **Structured Inputs**: Keep the PR plan in a clean Excel table format to maximize agent accuracy.

## Environment Note for User
> [!NOTE]
> To run the backend Python logic prototypes, you would need to install **Xcode Command Line Tools** by running `xcode-select --install` in your terminal. This provides the necessary compilers for Python packages.
