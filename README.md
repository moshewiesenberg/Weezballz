# DappleDoc PR Workflow MVP

This repo now focuses on one concrete outcome:

`PR plan CSV -> reviewable outreach drafts in Outlook`

The project is intentionally human-in-the-loop. DappleDoc generates the outreach queue and the draft copy, but a person still reviews each message inside Outlook before sending.

## What Works Now

- [mock_data/pr_plan.csv](mock_data/pr_plan.csv) is the current source of truth for outreach tasks.
- [backend/modal_agent.py](backend/modal_agent.py) reads the PR plan, filters pending rows, and builds a draft queue.
- [outlook-addin/src/taskpane.html](outlook-addin/src/taskpane.html) and [outlook-addin/src/taskpane.js](outlook-addin/src/taskpane.js) let you:
  - load the plan,
  - generate an outreach queue,
  - review each draft,
  - open the draft in Outlook for final review/send.
- The inbox feature is now a manual assistant:
  - open one email in Outlook,
  - click `Draft Reply`,
  - review the generated reply.

## Current Product Scope

### MVP

1. Read pending PR tasks from the plan.
2. Generate draft emails for those tasks.
3. Let the user review/edit drafts in Outlook.
4. Support one-email-at-a-time reply drafting.

### Explicitly Deferred to Phase Two

- automatic inbox monitoring
- automatic calendar scheduling
- autonomous sending
- multi-step background orchestration
- syncing plan status back into Excel/CSV

See [PHASE_TWO_ROADMAP.md](PHASE_TWO_ROADMAP.md) for the next stage.

## Local Files to Know

- [mock_data/pr_plan.csv](mock_data/pr_plan.csv): current PR plan
- [backend/persona.md](backend/persona.md): writing guidance for generated copy
- [backend/authenticate_ms.py](backend/authenticate_ms.py): Graph auth helper for later inbox automation
- [prototypes/index.html](prototypes/index.html): original visual prototype

## Setup Notes

### Backend

The backend is designed for Modal deployment through [backend/deploy_agent.sh](backend/deploy_agent.sh).

Expected secret:

- `OPENAI_API_KEY`

Optional phase-two secrets:

- `MS_CLIENT_ID`
- `MS_CLIENT_SECRET`
- `MS_TENANT_ID`

If `OPENAI_API_KEY` is missing, the backend falls back to deterministic template-based draft generation so the MVP still works.

### Restoring Live OpenAI Drafting

Right now the deployed key is present but out of quota, so the app falls back to `guided-template` mode.

To restore live `gpt-4o-mini` drafting:

1. Make sure your OpenAI API billing is active and the account has available credits or spend headroom.
2. Create a fresh API key in the OpenAI platform.
3. Export it in your shell:

```bash
export OPENAI_API_KEY="sk-..."
```

4. Run the readiness script:

```bash
python3 backend/openai_readiness.py --sync-modal-secret --redeploy --verify-remote
```

If everything is healthy, the final remote check should report `firstGenerationMode` as `gpt-4o-mini` instead of `guided-template`.

### Outlook Add-in

From [outlook-addin](outlook-addin):

```bash
npm install
npm start
```

The manifest is [outlook-addin/manifest.xml](outlook-addin/manifest.xml).

### Fastest Local Demo

If Outlook sideloading is getting in the way, use the browser-backed local demo:

```bash
./run_local_demo.sh
```

Then open:

- `http://127.0.0.1:9000/demo/outlook_preview.html`

This uses the same PR-plan-to-draft workflow and reply drafting flow, but runs inside the browser preview instead of waiting on Outlook add-in setup.

## Recommended Boss Demo Path

For a live walkthrough today, use the browser-backed local demo above.

Why this is the best path right now:

- it avoids Outlook sideloading friction,
- it prefers the local backend when launched from `127.0.0.1`,
- and if the Modal OpenAI key is out of quota, the app still generates polished guided-template drafts instead of failing.

## Why This Repo Changed

The earlier version tried to jump directly from concept to a fully agentic PR operator. That made the project feel bigger than it was. The repo now centers on the shortest useful workflow we can actually ship and demo.
