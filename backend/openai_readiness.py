#!/usr/bin/env python3
"""Check OpenAI API readiness and optionally sync the key into Modal."""

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
MODAL_URL = "https://moshewiesenberg--dappledoc-agent-api.modal.run"
MODAL_BIN = os.environ.get("MODAL_BIN", str(Path.home() / "Library/Python/3.9/bin/modal"))
SECRET_NAME = "dappledoc-secrets"


def _api_key() -> str:
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set in your environment.")
    return key


def _mask(value: str) -> str:
    return f"{value[:7]}...{value[-4:]}" if len(value) >= 12 else "<too-short>"


def _call_openai(api_key: str) -> dict:
    payload = json.dumps(
        {
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Reply with the single word: ok"}],
            "max_tokens": 5,
        }
    ).encode("utf-8")

    request = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8", errors="ignore")
            data = json.loads(body)
            return {
                "ok": True,
                "status": response.status,
                "model": data.get("model", "gpt-4o-mini"),
                "reply": data["choices"][0]["message"]["content"],
            }
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        try:
            parsed = json.loads(body)
        except Exception:
            parsed = {"error": {"message": body[:500], "code": "unknown"}}
        return {
            "ok": False,
            "status": exc.code,
            "error": parsed.get("error", {}),
        }


def _sync_modal_secret(api_key: str) -> None:
    command = [
        MODAL_BIN,
        "secret",
        "create",
        SECRET_NAME,
        f"OPENAI_API_KEY={api_key}",
        "--force",
    ]
    subprocess.run(command, check=True, cwd=REPO_ROOT)


def _redeploy() -> None:
    command = [MODAL_BIN, "deploy", str(REPO_ROOT / "backend" / "modal_agent.py")]
    subprocess.run(command, check=True, cwd=REPO_ROOT)


def _verify_remote() -> dict:
    request = urllib.request.Request(f"{MODAL_URL}/generate_outreach_queue", data=b"{}", method="POST")
    request.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.loads(response.read().decode("utf-8", errors="ignore"))
        queue = payload.get("queue") or []
        first = queue[0] if queue else {}
        return {
            "pendingCount": payload.get("pendingCount", 0),
            "firstGenerationMode": first.get("generationMode"),
            "firstSubject": first.get("subject"),
        }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check OpenAI readiness for DappleDoc.")
    parser.add_argument("--sync-modal-secret", action="store_true", help="Overwrite dappledoc-secrets with OPENAI_API_KEY.")
    parser.add_argument("--redeploy", action="store_true", help="Redeploy the Modal backend after syncing the secret.")
    parser.add_argument("--verify-remote", action="store_true", help="Call the deployed backend and report its generation mode.")
    args = parser.parse_args()

    try:
        api_key = _api_key()
    except RuntimeError as exc:
        print(json.dumps({"ready": False, "reason": str(exc)}, indent=2))
        return 1

    print(json.dumps({"candidateKey": _mask(api_key)}, indent=2))
    openai_result = _call_openai(api_key)
    print(json.dumps({"openaiCheck": openai_result}, indent=2))

    if not openai_result.get("ok"):
        return 2

    if args.sync_modal_secret:
        _sync_modal_secret(api_key)
        print(json.dumps({"modalSecret": f"{SECRET_NAME} updated"}, indent=2))

    if args.redeploy:
        _redeploy()
        print(json.dumps({"modalDeploy": "completed"}, indent=2))

    if args.verify_remote:
        remote_result = _verify_remote()
        print(json.dumps({"remoteCheck": remote_result}, indent=2))

    return 0


if __name__ == "__main__":
    sys.exit(main())
