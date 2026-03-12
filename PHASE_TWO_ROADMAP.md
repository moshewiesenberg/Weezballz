# Phase Two Roadmap

This document separates the next automation layer from the MVP so the repo stays focused.

## After the MVP is Stable

### 1. Sync PR plan status back to a writable data source

The MVP reads from `mock_data/pr_plan.csv` but does not persist changes. The next version should move to a writable store such as:

- Excel Online
- SharePoint list
- Airtable
- lightweight database

### 2. Inbox monitoring

Move from "open one email and draft a reply" to:

- poll or subscribe to Outlook messages
- classify intent
- draft the next recommended action
- route only meaningful replies into a review queue

### 3. Scheduling assistant

Once reply classification is reliable, add:

- available-slot lookup
- preformatted meeting options
- optional calendar invite generation

### 4. Plan orchestration

Only after the previous steps are stable should DappleDoc orchestrate multi-step runs such as:

- scan plan
- generate drafts
- notify reviewer
- process replies
- suggest follow-ups

### 5. Stronger state tracking

Add durable tracking for:

- draft created
- reviewed
- opened in Outlook
- sent
- replied
- scheduled

### 6. Security hardening

Before any broader rollout:

- remove local token files from active workflows
- rotate any previously exposed refresh tokens
- store credentials only in secret managers
- define least-privilege Graph scopes

## Definition of Done for Leaving MVP Mode

DappleDoc is ready for phase two when:

1. A reviewer can generate and review outreach drafts reliably from the PR plan.
2. The Outlook add-in loads without broken manifest references.
3. The backend works with and without OpenAI configured.
4. The review flow is understandable enough for a non-technical teammate to demo.
