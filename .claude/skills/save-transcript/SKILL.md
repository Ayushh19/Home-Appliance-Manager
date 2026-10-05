---
name: save-transcript
description: Save the current Claude Code session's transcript as a Markdown file in the project's conversations/ folder, named after the session. Use when the user asks to save, store, export or archive this session's conversation or transcript.
---

# Save transcript

Run the bundled script from the project root:

```bash
python3 .claude/skills/save-transcript/scripts/save_transcript.py
```

What it does:
- Reads this session's transcript from `~/.claude/projects/<project>/<session-id>.jsonl`. The current session is the most recently updated one.
- Creates `conversations/` in the project root if it doesn't exist.
- Names the file after the session: the name set with `/rename` if there is one, otherwise Claude Code's automatic title, otherwise the session id.
- Overwrites that session's file if it was saved before, so re-running brings it up to date. If a different session already has the same name, the session id's first 8 characters are added to the file name.
- Writes each user prompt as sent, and each Claude reply as its text, with tool calls listed by name only. Tool output, thinking, subagent messages and system reminders are left out.

Options, when the user asks for them:
- `--name "My name"`: use this file name instead of the session's name.
- `--session <id>`: save a different session of this project.

After running it, tell the user the file path the script printed. Don't print the transcript's contents back into the chat.
