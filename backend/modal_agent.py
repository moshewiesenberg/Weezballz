import csv
import datetime as dt
import os
from pathlib import Path
from typing import Dict, List, Optional

import modal
from fastapi import FastAPI, Request


REPO_ROOT = Path(__file__).resolve().parents[1]
MOCK_DATA_DIR = REPO_ROOT / "mock_data"
PERSONA_PATH = Path(__file__).resolve().parent / "persona.md"

REMOTE_MOCK_DATA_DIR = "/root/mock_data"
REMOTE_PERSONA_PATH = "/root/persona.md"
REMOTE_PLAN_PATH = f"{REMOTE_MOCK_DATA_DIR}/pr_plan.csv"
LOCAL_PLAN_PATH = MOCK_DATA_DIR / "pr_plan.csv"

image = (
    modal.Image.debian_slim()
    .pip_install("fastapi", "openai")
    .add_local_dir(local_path=str(MOCK_DATA_DIR), remote_path=REMOTE_MOCK_DATA_DIR)
    .add_local_file(local_path=str(PERSONA_PATH), remote_path=REMOTE_PERSONA_PATH)
)

app = modal.App("dappledoc-agent")
web_app = FastAPI(title="DappleDoc PR Agent API")


def _read_plan_rows() -> List[Dict[str, str]]:
    plan_path = Path(REMOTE_PLAN_PATH)
    if not plan_path.exists():
        plan_path = LOCAL_PLAN_PATH

    with open(plan_path, newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def _status_bucket(raw_status: str) -> str:
    normalized = (raw_status or "").strip().lower()
    if normalized in {"sent", "done"}:
        return "sent"
    if normalized in {"interested", "replied"}:
        return "phase_two"
    if normalized in {"pending", "not started", "not_started"}:
        return "pending"
    return "other"


def _plan_summary(rows: List[Dict[str, str]]) -> Dict[str, int]:
    counts = {"pending": 0, "sent": 0, "phase_two": 0, "other": 0}
    for row in rows:
        counts[_status_bucket(row.get("Status", ""))] += 1
    counts["total"] = len(rows)
    return counts


def _normalize_fragment(text: str, default: str) -> str:
    cleaned = " ".join((text or "").strip().split())
    if not cleaned:
        return default
    return cleaned.rstrip(".")


def _draft_angle(draft_type: str, outlet: str, notes: str) -> str:
    note_fragment = _normalize_fragment(notes, "a practical AI workflow for modern PR teams")
    draft_key = (draft_type or "").strip().lower()

    if draft_key == "tech news":
        return (
            f"there may be a timely story here for {outlet} around {note_fragment.lower()}, "
            "especially because the product turns a campaign plan into ready-to-review outreach"
        )
    if draft_key == "podcast":
        return (
            f"it feels like a strong podcast conversation for {outlet} around {note_fragment.lower()}, "
            "with a concrete example of where human review still matters"
        )
    if draft_key == "feature draft":
        return (
            f"there could be a thoughtful feature angle for {outlet} around {note_fragment.lower()}, "
            "grounded in how AI agents fit into real team workflows"
        )
    return f"the angle on {note_fragment.lower()} seems relevant for {outlet}'s audience"


def _cta_line(timing: str) -> str:
    timing_key = (timing or "").strip().lower()
    if "asap" in timing_key or "this week" in timing_key:
        return "If helpful, I can send a short overview and product screenshots right away."
    if "next week" in timing_key or "week of" in timing_key or "late" in timing_key or "end of" in timing_key:
        return "If helpful, I can send a short overview, product screenshots, or line up a quick walkthrough next week."
    return "If helpful, I can send a short overview, product screenshots, or a quick walkthrough."


def _fallback_outreach(row: Dict[str, str]) -> Dict[str, str]:
    journalist = row.get("Journalist", "there").strip()
    outlet = row.get("Outlet", "your outlet").strip()
    draft_type = row.get("Draft Type", "Quick Pitch").strip()
    notes = row.get("Notes", "").strip()
    timing = row.get("Suggested Timing", "").strip()

    subject_map = {
        "Tech News": f"Story idea for {outlet}: DappleDoc turns PR plans into reviewable drafts",
        "Podcast": f"Podcast idea for {outlet}: where AI helps PR teams move faster",
        "Feature Draft": f"Feature idea for {outlet}: what AI should automate and what humans should review",
        "Quick Pitch": f"Quick intro for {outlet}: DappleDoc for PR teams",
    }
    subject = subject_map.get(draft_type, f"{draft_type} idea for {outlet}: DappleDoc")
    angle = _draft_angle(draft_type, outlet, notes)
    cta = _cta_line(timing)

    body = (
        f"Hi {journalist},\n\n"
        "I'm reaching out from DappleDoc. We're building a human-reviewed PR workflow that turns "
        "campaign plans into ready-to-edit outreach drafts and reply suggestions inside Outlook.\n\n"
        f"I thought this could be a fit for {outlet} because {angle}.\n\n"
        f"{cta}\n\n"
        "Best,\n"
        "[Your Name]"
    )
    return {"subject": subject, "body": body, "model": "guided-template"}


def _load_persona() -> str:
    try:
        remote_persona = Path(REMOTE_PERSONA_PATH)
        if remote_persona.exists():
            return remote_persona.read_text(encoding="utf-8").strip()
        return PERSONA_PATH.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "You are a concise PR assistant who writes natural, professional outreach."


def _llm_outreach(row: Dict[str, str]) -> Dict[str, str]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return _fallback_outreach(row)

    from openai import OpenAI

    persona = _load_persona()
    journalist = row.get("Journalist", "").strip()
    outlet = row.get("Outlet", "").strip()
    draft_type = row.get("Draft Type", "").strip()
    notes = row.get("Notes", "").strip()

    prompt = f"""
{persona}

Write one short outreach email for this PR plan row.

Journalist: {journalist}
Outlet: {outlet}
Draft type: {draft_type}
Notes: {notes}

Return plain text in this exact format:
Subject: <subject line>

<email body>
""".strip()

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.5,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content or ""
    except Exception as exc:
        print(f"LLM outreach generation failed, falling back to template: {exc}")
        return _fallback_outreach(row)

    if "Subject:" not in content:
        return _fallback_outreach(row)

    lines = content.strip().splitlines()
    subject = lines[0].replace("Subject:", "", 1).strip()
    body = "\n".join(lines[1:]).strip()
    if not subject or not body:
        return _fallback_outreach(row)
    return {"subject": subject, "body": body, "model": "gpt-4o-mini"}


def _build_outreach_queue(limit: Optional[int] = None) -> Dict[str, object]:
    rows = _read_plan_rows()
    pending_rows = [row for row in rows if _status_bucket(row.get("Status", "")) == "pending"]
    if limit is not None:
        pending_rows = pending_rows[:limit]

    generated_at = dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
    queue = []
    for row in pending_rows:
        draft = _llm_outreach(row)
        queue.append(
            {
                "journalist": row.get("Journalist", ""),
                "outlet": row.get("Outlet", ""),
                "email": row.get("Contact Email", ""),
                "timing": row.get("Suggested Timing", ""),
                "draftType": row.get("Draft Type", ""),
                "notes": row.get("Notes", ""),
                "status": row.get("Status", ""),
                "subject": draft["subject"],
                "body": draft["body"],
                "generationMode": draft["model"],
            }
        )

    return {
        "generatedAt": generated_at,
        "summary": _plan_summary(rows),
        "pendingCount": len(queue),
        "queue": queue,
    }


def _fallback_reply(subject: str, body: str) -> str:
    combined = f"{subject}\n{body}".lower()

    if any(term in combined for term in ["demo", "walkthrough", "next week", "call", "chat", "meet", "meeting"]):
        return (
            "Thanks for the note. Happy to set up a quick walkthrough.\n\n"
            "I can send a few times for next week, or you can use [Calendar Link] if that's easier. "
            "If there is anything specific you want to see, I can tailor the demo around it.\n\n"
            "Best,\n"
            "[Your Name]"
        )

    if any(term in combined for term in ["learn more", "more info", "more information", "details", "context", "overview"]):
        return (
            "Thanks for reaching out. Happy to send more context on DappleDoc.\n\n"
            "I can share a short overview, a few screenshots, and a quick summary of how the workflow fits into a PR team's day-to-day process.\n\n"
            "Best,\n"
            "[Your Name]"
        )

    return (
        "Thanks for the note. Happy to send more context and propose a few times for a quick chat.\n\n"
        "Best,\n"
        "[Your Name]"
    )


def _draft_reply(subject: str, body: str) -> Dict[str, str]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return {"draft": _fallback_reply(subject, body), "model": "guided-template"}

    from openai import OpenAI

    persona = _load_persona()
    prompt = f"""
{persona}

Draft a short professional reply to the following inbound email. Keep it concise and ready for human review.

Subject:
{subject}

Inbound email:
{body}
""".strip()

    try:
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0.4,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as exc:
        print(f"LLM reply generation failed, falling back to template: {exc}")
        return {"draft": _fallback_reply(subject, body), "model": "guided-template"}

    return {
        "draft": response.choices[0].message.content or _fallback_reply(subject, body),
        "model": "gpt-4o-mini",
    }


@web_app.get("/")
@web_app.get("/status")
async def status():
    rows = _read_plan_rows()
    return {
        "status": "online",
        "mode": "mvp",
        "llmConfigured": bool(os.environ.get("OPENAI_API_KEY")),
        "timestamp": dt.datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
        "summary": _plan_summary(rows),
        "phaseTwo": {
            "inbox_monitoring": "manual review only",
            "calendar_scheduling": "not implemented",
            "auto_send": "disabled by design",
        },
    }


@web_app.get("/get_plan")
async def get_plan():
    rows = _read_plan_rows()
    return {"rows": rows, "summary": _plan_summary(rows)}


@web_app.post("/generate_outreach_queue")
async def generate_outreach_queue(request: Request):
    payload = await request.json() if request.headers.get("content-type", "").startswith("application/json") else {}
    limit = payload.get("limit")
    if isinstance(limit, int) and limit > 0:
        return _build_outreach_queue(limit=limit)
    return _build_outreach_queue()


@web_app.post("/trigger_run")
async def trigger_run():
    # Backward-compatible alias used by earlier prototypes.
    return _build_outreach_queue()


@web_app.post("/analyze_email")
async def analyze_email(request: Request):
    data = await request.json()
    subject = (data.get("subject") or "").strip()
    body = (data.get("body") or "").strip()
    if not body:
        return {"error": "No email body provided."}
    return _draft_reply(subject, body)


@app.function(image=image, secrets=[modal.Secret.from_name("dappledoc-secrets")])
@modal.asgi_app()
def api():
    return web_app
