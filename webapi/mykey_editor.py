"""
Edit GenericAgent's mykey.py / mykey.json to register UI-added LLM endpoints.

Why this module exists
----------------------
GenericAgent already has a complete LLM registry: any dict variable defined in
`mykey.py` (or top-level entry in `mykey.json`) whose name contains
"api/config/cookie" is auto-loaded and instantiated as an LLMSession by
`agentmain.GeneraticAgent.load_llm_sessions()`. The naming keywords
(`native`/`claude`/`oai`/`mixin`) decide the session class.

Crucially, `llmcore.reload_mykeys()` is called *inside* `list_llms()` and
`next_llm()` and uses `os.stat(...).st_mtime_ns` to detect changes. So if we
write to mykey.py, the very next list/switch call will pick the change up
**without restarting anything**.

Strategy
--------
We never touch user-authored content. We maintain a clearly fenced section
between two marker comments and only rewrite the inside of that fence:

    # === BEGIN UI-MANAGED LLM CONFIGS (managed by webapi adapter; do not edit) ===
            ui_<rid>_native_oai_config = { ... }
            ui_<rid2>_native_oai_config = { ... }
    # === END UI-MANAGED LLM CONFIGS ===

If `mykey.py` exists we edit it. Else if `mykey.json` exists we edit it
(top-level keys, prefixed with `_ui_`). Else we create a fresh `mykey.py`
that contains only the marker section.

The variable name pattern `ui_<rid>_native_oai_config` satisfies GA's
keyword scan: contains "config" (picked up) and "native"+"oai" (instantiated as
NativeOAISession with native function calling). We still recognize legacy
`_ui_...` names during reads for backward compatibility, but new writes must
avoid a leading underscore because GenericAgent filters out private names when
loading `mykey.py`.
"""

from __future__ import annotations
import os, re, json, ast, uuid, threading, pprint
from typing import Any, Dict, List, Optional, Tuple

_LOCK = threading.Lock()

_BEGIN = "# === BEGIN UI-MANAGED LLM CONFIGS (managed by webapi adapter; do not edit) ==="
_END   = "# === END UI-MANAGED LLM CONFIGS ==="
_VAR_RE = re.compile(
    r"^(?:_?ui_)([A-Za-z0-9]+)_native_oai_config\s*=\s*(\{.*?\})(?=\n(?:\s*\n)*# === END UI-MANAGED LLM CONFIGS ===|\n(?:\s*\n)*(?:_?ui_)[A-Za-z0-9]+_native_oai_config\s*=|$)",
    re.M | re.S,
)
_KEY_RE = re.compile(r"^(?:_?ui_)([A-Za-z0-9]+)_native_oai_config$")


# ── Path resolution ──────────────────────────────────────────────────────
def _ga_root() -> str:
    from . import agent_bridge
    if agent_bridge._REPO_ROOT is None:
        raise RuntimeError(
            "Cannot edit mykey: GenericAgent repo root not found. "
            "Set GA_REPO_ROOT or place webapi/ at GA root."
        )
    return agent_bridge._REPO_ROOT


def _target() -> Tuple[str, str]:
    """Return (path, kind) where kind is 'py' or 'json'."""
    root = _ga_root()
    py = os.path.join(root, "mykey.py")
    js = os.path.join(root, "mykey.json")
    if os.path.exists(py):
        return py, "py"
    if os.path.exists(js):
        return js, "json"
    return py, "py"  # will be created on first write


# ── Common helpers ───────────────────────────────────────────────────────
def _safe_id(rid: Optional[str]) -> str:
    if not rid:
        return uuid.uuid4().hex[:10]
    return re.sub(r"[^A-Za-z0-9]", "", rid) or uuid.uuid4().hex[:10]


def _mask(k: str) -> str:
    if not k:
        return ""
    if len(k) < 10:
        return "•" * len(k)
    return k[:4] + "•" * 6 + k[-4:]


def _to_cfg(item: Dict[str, Any]) -> Dict[str, Any]:
    """Translate UI form to GA native_oai_config dict."""
    cfg: Dict[str, Any] = {
        "name": str(item["name"]).strip(),
        "apikey": str(item["api_key"]),
        "apibase": str(item["base_url"]).rstrip("/"),
        "model": str(item["model"]).strip(),
    }
    # Optional pass-throughs (silently ignored if absent)
    for src, dst in [
        ("temperature", "temperature"),
        ("max_tokens", "max_tokens"),
        ("reasoning_effort", "reasoning_effort"),
        ("api_mode", "api_mode"),
        ("context_win", "context_win"),
        ("connect_timeout", "connect_timeout"),
        ("read_timeout", "read_timeout"),
    ]:
        v = item.get(src)
        if v is not None and v != "":
            cfg[dst] = v
    return cfg


def _public_view(rid: str, cfg: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": rid,
        "name": cfg.get("name", ""),
        "base_url": cfg.get("apibase", ""),
        "api_key": _mask(cfg.get("apikey", "")),
        "model": cfg.get("model", ""),
        "enabled": True,
    }


# ── .py backend ──────────────────────────────────────────────────────────
def _read_py_section(path: str) -> Tuple[str, str, str]:
    """Return (head, body, tail) where body is between markers (or empty)."""
    if not os.path.exists(path):
        return "", "", ""
    with open(path, encoding="utf-8") as f:
        txt = f.read()
    m = re.search(re.escape(_BEGIN) + r"(.*?)" + re.escape(_END), txt, re.S)
    if not m:
        return txt, "", ""
    return txt[:m.start()], m.group(1), txt[m.end():]


def _format_dict(d: Dict[str, Any]) -> str:
    """Pretty-print a dict literal that ast.literal_eval can read back."""
    return pprint.pformat(d, indent=4, width=100, sort_dicts=False)


def _write_py(path: str, entries: Dict[str, Dict[str, Any]]) -> None:
    head, _body, tail = _read_py_section(path)
    if not head and not tail:
        # File doesn't exist or has no markers yet — start fresh / append.
        if os.path.exists(path):
            with open(path, encoding="utf-8") as f:
                head = f.read().rstrip() + "\n\n"
        else:
            head = '"""mykey.py — managed by GenericAgent webapi adapter."""\n\n'
        tail = "\n"
    lines = [_BEGIN, ""]
    for rid, cfg in entries.items():
        lines.append(f"ui_{rid}_native_oai_config = {_format_dict(cfg)}")
        lines.append("")
    lines.append(_END)
    new = head.rstrip() + "\n\n" + "\n".join(lines) + "\n" + tail.lstrip("\n")
    _atomic_write(path, new)


def _read_py(path: str) -> Dict[str, Dict[str, Any]]:
    _, body, _ = _read_py_section(path)
    out: Dict[str, Dict[str, Any]] = {}
    for m in _VAR_RE.finditer(body):
        rid = m.group(1)
        try:
            out[rid] = ast.literal_eval(m.group(2))
        except Exception:
            pass
    return out


# ── .json backend ────────────────────────────────────────────────────────
def _read_json(path: str) -> Tuple[Dict[str, Any], Dict[str, Dict[str, Any]]]:
    if not os.path.exists(path):
        return {}, {}
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    ours: Dict[str, Dict[str, Any]] = {}
    for k, v in list(data.items()):
        m = _KEY_RE.match(k)
        if m and isinstance(v, dict):
            ours[m.group(1)] = v
    return data, ours


def _write_json(path: str, entries: Dict[str, Dict[str, Any]]) -> None:
    data, _ours = _read_json(path)
    # Strip any existing UI-managed entries, then re-add.
    for k in [k for k in data if _KEY_RE.match(k)]:
        del data[k]
    for rid, cfg in entries.items():
        data[f"ui_{rid}_native_oai_config"] = cfg
    _atomic_write(path, json.dumps(data, ensure_ascii=False, indent=2))


# ── Atomic write ─────────────────────────────────────────────────────────
def _atomic_write(path: str, content: str) -> None:
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(content)
    os.replace(tmp, path)


# ── Public API ───────────────────────────────────────────────────────────
def list_managed() -> List[Dict[str, Any]]:
    with _LOCK:
        path, kind = _target()
        entries = _read_py(path) if kind == "py" else _read_json(path)[1]
        return [_public_view(rid, cfg) for rid, cfg in entries.items()]


def upsert(item: Dict[str, Any]) -> Dict[str, Any]:
    with _LOCK:
        path, kind = _target()
        entries = _read_py(path) if kind == "py" else _read_json(path)[1]
        rid = _safe_id(item.get("id"))

        # If editing an existing item and api_key looks masked, keep the old key.
        cfg = _to_cfg(item)
        if rid in entries and ("•" in cfg["apikey"] or cfg["apikey"].count("*") > 4):
            cfg["apikey"] = entries[rid].get("apikey", cfg["apikey"])

        entries[rid] = cfg
        if kind == "py":
            _write_py(path, entries)
        else:
            _write_json(path, entries)
        return _public_view(rid, cfg)


def delete(rid: str) -> bool:
    with _LOCK:
        rid = _safe_id(rid)
        path, kind = _target()
        if not os.path.exists(path):
            return False
        entries = _read_py(path) if kind == "py" else _read_json(path)[1]
        if rid not in entries:
            return False
        del entries[rid]
        if kind == "py":
            _write_py(path, entries)
        else:
            _write_json(path, entries)
        return True


def is_managed_var_name(name: str) -> bool:
    """Used by agent_bridge to mark which LLMs in list_llms() came from us."""
    return bool(_KEY_RE.match(name))

