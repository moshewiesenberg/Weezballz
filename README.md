# DappleDoc PR Automation Prototype

This project is an AI-powered agentic workflow designed to automate the manual execution of PR (Public Relations) plans. It demonstrates an "Agent Hive" architecture where specialized agents collaborate to analyze plans, personalize outreach, monitor responses, and schedule meetings.

## 🚀 The Vision
The goal is to reduce the operational overhead of PR campaigns by leveraging AI to handle repetitive tasks while maintaining a human-like personalization. In a production environment, this system would integrate with Microsoft 365 (Copilot, Excel, Outlook).

## 🛠 Project Components
- **Dashboard Simulation**: A local web application (`prototypes/index.html`) that visualizes the AI's decision-making process.
- **Agent Hive Logic**:
  - **Scanner**: Identifies pending tasks in the PR plan.
  - **Personalizer**: Drafts tailored outreach using brand guidance.
  - **Monitor**: Tracks inbox replies.
  - **Scheduler**: Coordinates meetings automatically.
- **Mock Data**: Sample PR plans and messaging guidance used to ground the AI's logic.

## 📈 Current Status: Prototype Simulation
This repository contains a **Visual Prototype**. It simulates the end-to-end workflow of the PR agents. 

### How to run the simulation:
1. Clone the repository.
2. Open `prototypes/index.html` in any web browser.
3. Use the interactive controls to step through the agent workflows.

## 🏗 Real-World Implementation
Beyond this prototype, the full system is designed to run in the **Microsoft 365 Cloud** using:
- **Microsoft Copilot Studio** for agent orchestration.
- **Power Automate** for event-driven triggers and email automation.
- **Excel Online** as the "Ground Truth" for plan management.

---
*Created as part of the DappleDoc PR Automation project.*
