"""SSE event protocol — kept in sync with frontend `lib/chat/protocol.ts`.

Adding a new event type is non-breaking: the frontend renderer registry falls
back to a text bubble for unknown types. New types are *additive*.

Wire format: each line is `data: <json>\n\n`. The JSON has the same shape as
the TypeScript `SSEEvent` union: `{ type, payload, meta? }`.
"""
from __future__ import annotations
import json, time, uuid
from typing import Any, Dict, Optional


def _ts() -> str:
    t = time.localtime()
    return time.strftime("%Y-%m-%d %H:%M:%S", t)


def _evt(type_: str, payload: Dict[str, Any], meta: Optional[Dict[str, Any]] = None) -> str:
    obj: Dict[str, Any] = {"type": type_, "payload": payload}
    if meta:
        obj["meta"] = meta
    return f"data: {json.dumps(obj, ensure_ascii=False)}\n\n"


def evt_session_start() -> str:
    return _evt("session.start", {"sessionId": uuid.uuid4().hex, "ts": _ts()})


def evt_session_end() -> str:
    return _evt("session.end", {"sessionId": ""})


def evt_message_start(message_id: str, role: str = "assistant") -> str:
    return _evt("message.start", {"id": message_id, "role": role, "ts": _ts()})


def evt_text_delta(message_id: str, delta: str) -> str:
    return _evt("message.delta", {"id": message_id, "delta": delta})


def evt_message_end(message_id: str, content: str = "") -> str:
    return _evt("message.end", {"id": message_id, "content": content})


def evt_image(message_id: str, url: str, prompt: str = "", alt: str = "",
              source: str = "agent") -> str:
    return _evt("attachment", {
        "id": uuid.uuid4().hex,
        "messageId": message_id,
        "kind": "image",
        "url": url,
        "alt": alt or prompt,
        "prompt": prompt,
        "source": source,
    })


def evt_tool_call(message_id: str, name: str, args: Any, status: str = "running",
                   result_preview: str = "") -> str:
    return _evt("tool.call", {
        "id": uuid.uuid4().hex,
        "messageId": message_id,
        "name": name,
        "args": args,
        "status": status,
        "resultPreview": result_preview,
    })


def evt_system(level: str, text: str) -> str:
    return _evt("system", {"level": level, "text": text})


def evt_error(message_id: Optional[str], message: str) -> str:
    # Errors surface as system toast + close the message.
    return evt_system("error", message)

