#!/usr/bin/env python3
"""Save a Claude Code session transcript as Markdown in <project>/conversations/.

Usage: save_transcript.py [--project DIR] [--session ID] [--name NAME]

- Session: --session, else the most recently updated session of the project (the current one).
- File name: --name, else the session's name (/rename title, else the auto title), else its id.
  Saving the same session again overwrites its file, so the transcript stays up to date.
- Content: your prompts and Claude's replies. Tool calls are listed by name and description;
  tool output, thinking, subagent chatter and system reminders are left out.
"""
import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

REMINDER = re.compile(r"<system-reminder>.*?</system-reminder>", re.S)
PASTED_TAG = re.compile(r"</?pasted_content[^>]*>")
TASK_NOTIFICATION = re.compile(r"<task-notification>")
COMMAND_TAGS = re.compile(r"</?(command-name|command-message|command-args|local-command-stdout|local-command-caveat)>")


def project_slug(project: Path) -> str:
    return re.sub(r"[^A-Za-z0-9]", "-", str(project.resolve()))


def find_session(project: Path, session_id: str | None) -> Path:
    sessions_dir = Path.home() / ".claude" / "projects" / project_slug(project)
    if not sessions_dir.is_dir():
        sys.exit(f"No Claude Code sessions found for {project} (looked in {sessions_dir}).")
    if session_id:
        path = sessions_dir / f"{session_id}.jsonl"
        if not path.exists():
            sys.exit(f"Session {session_id} not found in {sessions_dir}.")
        return path
    files = sorted(sessions_dir.glob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not files:
        sys.exit(f"No session transcripts in {sessions_dir}.")
    return files[0]


def clean_user_text(text: str) -> str:
    text = REMINDER.sub("", text)
    text = PASTED_TAG.sub("", text)
    text = COMMAND_TAGS.sub("", text)
    return text.strip()


def safe_filename(name: str) -> str:
    name = re.sub(r'[\\/:*?"<>|\x00-\x1f]', "-", name).strip(" .")
    return (name or "session")[:120]


def load(path: Path):
    records = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return records


def session_name(records) -> str | None:
    custom = ai = None
    for r in records:
        if r.get("type") == "custom-title" and r.get("customTitle"):
            custom = r["customTitle"]
        elif r.get("type") == "ai-title" and r.get("aiTitle"):
            ai = r["aiTitle"]
    return custom or ai


def turns(records):
    """Yields (role, timestamp, text) for each user prompt and each Claude reply."""
    pending = None  # assistant reply being assembled across streamed records

    def flush():
        nonlocal pending
        if pending and pending["parts"]:
            yield ("claude", pending["ts"], "\n\n".join(pending["parts"]))
        pending = None

    for r in records:
        if r.get("isSidechain") or r.get("isMeta") or r.get("type") not in ("user", "assistant"):
            continue
        content = (r.get("message") or {}).get("content")
        ts = r.get("timestamp", "")

        if r["type"] == "user":
            texts = []
            if isinstance(content, str):
                texts.append(content)
            elif not any(b.get("type") == "tool_result" for b in content or []):
                # Text riding along with tool results is added by Claude Code, not typed by the user.
                texts += [b.get("text", "") for b in content or [] if b.get("type") == "text"]
            text = clean_user_text("\n\n".join(texts))
            if TASK_NOTIFICATION.search(text):  # background-task events, not prompts
                text = ""

            if text:  # tool results carry no prompt text and are skipped
                yield from flush()
                yield ("you", ts, text)
            continue

        if pending is None:
            pending = {"ts": ts, "parts": []}
        for b in content or []:
            if b.get("type") == "text" and b.get("text", "").strip():
                pending["parts"].append(b["text"].strip())
            elif b.get("type") == "tool_use":
                inp = b.get("input") or {}
                detail = inp.get("description") or inp.get("file_path") or inp.get("skill") or ""
                pending["parts"].append(f"> _Tool: {b.get('name')}{' — ' + detail if detail else ''}_")
    yield from flush()


def fmt_time(ts: str) -> str:
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00")).astimezone().strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return ""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--project", default=".", help="project directory (default: current directory)")
    ap.add_argument("--session", help="session id (default: the most recently updated session)")
    ap.add_argument("--name", help="file name to use instead of the session's name")
    args = ap.parse_args()

    project = Path(args.project).resolve()
    path = find_session(project, args.session)
    records = load(path)
    session_id = path.stem
    title = args.name or session_name(records) or session_id

    out_dir = project / "conversations"
    out_dir.mkdir(exist_ok=True)
    out = out_dir / f"{safe_filename(title)}.md"
    # Another session already saved under this name: keep both.
    if out.exists() and f"Session: `{session_id}`" not in out.read_text(encoding="utf-8")[:500]:
        out = out_dir / f"{safe_filename(title)} ({session_id[:8]}).md"

    lines = [f"# {title}", "", f"Session: `{session_id}`  ", f"Saved: {datetime.now().strftime('%Y-%m-%d %H:%M')}", ""]
    count = 0
    for role, ts, text in turns(records):
        when = fmt_time(ts)
        lines += ["---", "", f"## {'You' if role == 'you' else 'Claude'}{f' · {when}' if when else ''}", "", text, ""]
        count += role == "you"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"Saved {count} prompts to {out}")


if __name__ == "__main__":
    main()
