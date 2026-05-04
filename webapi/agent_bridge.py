"""Thin wrapper around the unmodified `GeneraticAgent`.

We:
  - Import it lazily so the adapter still loads if the agent isn't on path
    (useful for unit tests).
  - Spin up its background `run` thread once per process.
  - Stream its queue output into an SSE-event generator, while letting our
    middleware pipeline transform each chunk.

Nothing in the original class is touched.

LLM management
--------------
We do NOT keep a parallel registry. UI-added LLMs are written into GA's
`mykey.py` by `mykey_editor.py`, so they go through GA's normal session
loader and inherit full agent capabilities (tools, prompt cache, thinking,
mixin failover...). `list_llms()` here just delegates to GA and tags which
entries we own (so the UI can show a "自定义" badge).
"""
from __future__ import annotations
import os, sys, threading, uuid
from typing import Iterator, List, Optional

# ─────────────────────────────────────────────────────────────────────────
# Locate the GenericAgent repo (where `agentmain.py` lives).
#
# Resolution order:
#   1. env var GA_REPO_ROOT  — explicit override, works for any layout
#   2. parent of this file   — when webapi/ is placed at GA repo root
#   3. grandparent           — when webapi/ is placed under GA/frontends/
#   4. cwd                   — last-resort fallback
#
# The first directory that contains `agentmain.py` wins.
# ─────────────────────────────────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
_CANDIDATES = [
    os.environ.get("GA_REPO_ROOT", ""),
    os.path.abspath(os.path.join(_HERE, "..")),         # webapi/ at GA root
    os.path.abspath(os.path.join(_HERE, "..", "..")),   # webapi/ under GA/frontends/
    os.getcwd(),
]
_REPO_ROOT = None
for c in _CANDIDATES:
    if c and os.path.isfile(os.path.join(c, "agentmain.py")):
        _REPO_ROOT = c
        break
if _REPO_ROOT and _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from .protocol import (
    evt_message_start, evt_message_end, evt_error,
)
from .middleware import DEFAULT_MIDDLEWARES
from .middleware.base import RequestContext
from . import mykey_editor

_agent = None
_agent_lock = threading.Lock()
_runner_patched = False


def _patch_agent_runner():
    """Monkey-patch agent_runner_loop to inject pending images as
    initial_user_content (multimodal content blocks).  This is the ONLY
    change needed — the rest of the agent pipeline already supports
    image_url content blocks."""
    global _runner_patched
    if _runner_patched:
        return
    try:
        import agent_loop as _al  # type: ignore
    except ImportError:
        return
    _orig = _al.agent_runner_loop

    def _patched(client, system_prompt, user_input, handler, tools_schema,
                 max_turns=40, verbose=True, initial_user_content=None):
        a = _agent
        if a is not None:
            pending = getattr(a, '_webui_images', None)
            if pending:
                # Build multimodal content: [text, image1, image2, ...]
                blocks = [{"type": "text", "text": user_input}]
                for img in pending:
                    url = (img.get("dataUrl") or img.get("data_url")) if isinstance(img, dict) else getattr(img, 'dataUrl', getattr(img, 'data_url', ''))
                    if url:
                        blocks.append({"type": "image_url",
                                       "image_url": {"url": url}})
                initial_user_content = blocks
                a._webui_images = None
        return _orig(client, system_prompt, user_input, handler, tools_schema,
                     max_turns=max_turns, verbose=verbose,
                     initial_user_content=initial_user_content)

    _al.agent_runner_loop = _patched
    _runner_patched = True


def get_agent():
    """Lazy-init singleton. The agent's own run loop is launched once."""
    global _agent
    with _agent_lock:
        if _agent is None:
            if _REPO_ROOT is None:
                raise RuntimeError(
                    "Could not locate GenericAgent repo. Tried: "
                    f"GA_REPO_ROOT env, {_HERE}/.., {_HERE}/../.., cwd. "
                    "Place this `webapi/` package inside the GenericAgent "
                    "repo root (next to agentmain.py), or set "
                    "GA_REPO_ROOT=/path/to/GenericAgent."
                )
            from agentmain import GeneraticAgent  # type: ignore
            try:
                import image_patch  # type: ignore
                image_patch._apply_patch()
            except Exception:
                pass
            a = GeneraticAgent()
            try:
                a.next_llm(0)
            except Exception as e:
                if 'No LLM backend configured' not in str(e):
                    raise
            a.inc_out = True   # incremental queue output — required for SSE
            a.verbose = True
            threading.Thread(target=a.run, daemon=True).start()
            _agent = a
            _patch_agent_runner()          # inject image support
        return _agent


# ── LLM listing/switching: pure delegation to GA ─────────────────────────
def _custom_var_names() -> set:
    """Names of mykey.py variables we wrote — for tagging purposes."""
    try:
        # Look up the live mykey module so the names match exactly what GA saw
        # during its last reload_mykeys() pass.
        from llmcore import _mykey_path  # type: ignore
        if _mykey_path and _mykey_path.endswith(".py"):
            import mykey  # type: ignore
            return {k for k in vars(mykey) if mykey_editor.is_managed_var_name(k)}
        elif _mykey_path and _mykey_path.endswith(".json"):
            import json
            with open(_mykey_path, encoding="utf-8") as f:
                data = json.load(f)
            return {k for k in data if mykey_editor.is_managed_var_name(k)}
    except Exception:
        pass
    return set()


def list_llms():
    """Return the merged list straight from GA, with a `custom` flag added."""
    a = get_agent()
    items = a.list_llms()  # [(idx, name, is_current), ...] — auto-reloads mykey
    current = next((i for (i, _, c) in items if c), 0)
    custom_names = _custom_var_names()
    # GA's display name comes from cfg['name']; we cross-check by display name
    # to avoid coupling to internals. Each managed entry's cfg['name'] is the
    # value the user typed, and GA exposes that same name via list_llms.
    managed_display = set()
    try:
        for v in mykey_editor.list_managed():
            managed_display.add(v.get("name", ""))
    except Exception:
        pass
    out = []
    for (idx, name, is_current) in items:
        out.append({
            "idx": idx,
            "name": name,
            "current": is_current,
            "custom": name in managed_display,
        })
    return {"llms": out, "current": current}


def switch_llm(idx: int) -> int:
    a = get_agent()
    a.next_llm(idx)
    return idx


def abort():
    a = _agent
    if a is not None:
        try: a.abort()
        except Exception: pass


def reinject_system_prompt():
    """Replicates the 'Re Inject SystemPrompt' button in stapp2.

    The agent rebuilds the system prompt from disk every turn anyway; this
    nudges it by clearing cached tools and trimming history.
    """
    a = get_agent()
    try: a.llmclient.last_tools = ""
    except Exception: pass
    try: a.llmclient.backend.history = []
    except Exception: pass


def stream_request(query: str, images: Optional[List[dict]] = None,
                   middlewares=None) -> Iterator[str]:
    """Yields SSE-event strings for one chat round."""
    if middlewares is None:
        middlewares = DEFAULT_MIDDLEWARES
    msg_id = uuid.uuid4().hex
    ctx = RequestContext(message_id=msg_id, query=query, images=images or [])

    # ── 1. Input phase ─────────────────────────────────────────────────
    try:
        for mw in middlewares:
            mw.on_input(ctx)
            if ctx.short_circuit_events:
                yield from ctx.short_circuit_events
                return
    except Exception as e:
        yield evt_error(msg_id, f"Input middleware error: {e}")
        yield evt_message_end(msg_id, content="")
        return

    # ── 2. Run the GA agent (handles both native and UI-added LLMs) ────
    yield evt_message_start(msg_id)
    full_text = ""
    try:
        a = get_agent()
        if ctx.images:
            a._webui_images = ctx.images       # legacy fallback for older monkey-patched runners
        dq = a.put_task(ctx.query, source="user", images=ctx.images)
        while True:
            try:
                item = dq.get(timeout=300)
            except Exception:
                yield evt_error(msg_id, "Agent timed out")
                break

            next_piece = item.get("next") or ""
            if next_piece:
                full_text += next_piece
                for mw in middlewares:
                    for ev in mw.on_chunk(ctx, next_piece):
                        yield ev

            if "done" in item:
                done_text = item.get("done") or ""
                if not full_text:
                    full_text = done_text
                break
        # ── 3. Done phase (reverse order) ──────────────────────────────
        for mw in reversed(middlewares):
            for ev in mw.on_done(ctx, full_text):
                yield ev
        yield evt_message_end(msg_id, content=full_text)
    except Exception as e:
        import traceback; traceback.print_exc()
        yield evt_error(msg_id, str(e))
        yield evt_message_end(msg_id, content=full_text)

