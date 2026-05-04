"""FastAPI entry point.

Run from your GenericAgent repo root:
    python -m frontends.webapi.server --port 8765
"""
from __future__ import annotations
import argparse
from typing import List, Optional, Any, Dict
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

from . import agent_bridge
from . import mykey_editor
from .config import Config
from .middleware import DEFAULT_MIDDLEWARES

app = FastAPI(title="GenericAgent Web Adapter", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=Config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ───────────────────────────────────────────────────────────────
class ImageAttachment(BaseModel):
    dataUrl: str
    name: Optional[str] = None
    mime: Optional[str] = None

class ChatRequest(BaseModel):
    query: str
    images: Optional[List[ImageAttachment]] = None
    attachments: Optional[List[ImageAttachment]] = None

class LLMSwitchRequest(BaseModel):
    idx: int

class CustomLLMRequest(BaseModel):
    id: Optional[str] = None
    name: str
    base_url: str
    api_key: str
    model: str
    enabled: bool = True
    headers: Optional[Dict[str, str]] = None
    temperature: Optional[float] = None
    extra: Optional[Dict[str, Any]] = None

# ── Routes ───────────────────────────────────────────────────────────────
@app.get("/health")
def health(): return {"ok": True, "version": "0.1.0"}

@app.get("/llms")
def llms(): return agent_bridge.list_llms()

@app.post("/llms")
def llms_switch(req: LLMSwitchRequest):
    agent_bridge.switch_llm(req.idx)
    return {"ok": True, "current": req.idx}

@app.post("/abort")
def abort():
    agent_bridge.abort()
    return {"ok": True}

# ── UI-managed LLM endpoints (write into GA's mykey.py) ──────────────────
# These edit a fenced section of `mykey.py` so newly added entries are
# instantiated by GA itself (full agent loop, tools, prompt cache, ...).
# GA's `reload_mykeys()` checks mtime, so the change is picked up on the
# very next /llms call without any manual reload.
@app.get("/custom_llms")
def custom_llms_list():
    return {"items": mykey_editor.list_managed()}

@app.post("/custom_llms")
def custom_llms_upsert(req: CustomLLMRequest):
    try:
        item = mykey_editor.upsert(req.model_dump(exclude_none=False))
        return {"ok": True, "item": item}
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=400)

@app.delete("/custom_llms/{cid}")
def custom_llms_delete(cid: str):
    try:
        return {"ok": mykey_editor.delete(cid)}
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=400)

@app.post("/reinject")
def reinject():
    agent_bridge.reinject_system_prompt()
    return {"ok": True}

@app.post("/chat")
def chat(req: ChatRequest):
    incoming_images = req.images or req.attachments or []
    images = [img.model_dump() for img in incoming_images]
    def gen():
        for ev in agent_bridge.stream_request(req.query, images=images, middlewares=DEFAULT_MIDDLEWARES):
            yield ev
    return StreamingResponse(gen(), media_type="text/event-stream", headers={
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    })

# ── Entrypoint ───────────────────────────────────────────────────────────
def main():
    p = argparse.ArgumentParser()
    p.add_argument("--host", default=Config.HOST)
    p.add_argument("--port", type=int, default=Config.PORT)
    args = p.parse_args()
    import uvicorn
    uvicorn.run(app, host=args.host, port=args.port, log_level="info")

if __name__ == "__main__":
    main()

