from __future__ import annotations

from typing import Any, Dict, List
from urllib import parse as urllib_parse
from urllib import request as urllib_request
import json

from .config import Config


class _UrllibResponse:
    def __init__(self, response):
        self._response = response
        self.status_code = getattr(response, "status", None) or response.getcode()

    def raise_for_status(self):
        if self.status_code and self.status_code >= 400:
            body = self._response.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"HTTP {self.status_code}: {body}")

    def json(self):
        body = self._response.read().decode("utf-8")
        return json.loads(body)


class _HttpxCompat:
    @staticmethod
    def post(
        url: str,
        *,
        headers: Dict[str, str] | None = None,
        json: Dict[str, Any] | None = None,
        timeout: int = 60,
        params: Dict[str, str] | None = None,
    ):
        if params:
            sep = '&' if '?' in url else '?'
            url = url + sep + urllib_parse.urlencode(params)
        payload = b""
        if json is not None:
            payload = __import__("json").dumps(json).encode("utf-8")
        req = urllib_request.Request(url, data=payload, headers=headers or {}, method="POST")
        if payload and "Content-Type" not in req.headers:
            req.add_header("Content-Type", "application/json")
        response = urllib_request.urlopen(req, timeout=timeout)
        return _UrllibResponse(response)


try:
    import httpx  # type: ignore
except Exception:
    httpx = _HttpxCompat()


def _request_text(user_query: str) -> str:
    q = (user_query or "").strip()
    return f"请基于用户问题描述这张图片的相关内容。用户问题：{q}" if q else "请客观描述这张图片中与用户问题最相关的内容。"


# ----- Gemini -----
def _gemini_endpoint() -> str:
    base = Config.GEMINI_BASE_URL.rstrip("/")
    suffix = f"/v1beta/models/{Config.GEMINI_MODEL}:generateContent"
    if base.endswith(":generateContent"):
        return base
    if base.endswith("/v1"):
        return base[:-3] + suffix
    if "/v1beta/models/" in base:
        return base
    return base + suffix


def _gemini_headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if Config.GEMINI_API_KEY:
        headers["x-goog-api-key"] = Config.GEMINI_API_KEY
        headers["Authorization"] = f"Bearer {Config.GEMINI_API_KEY}"
    return headers


def _gemini_params() -> Dict[str, str]:
    if not Config.GEMINI_API_KEY:
        return {}
    return {"key": Config.GEMINI_API_KEY}


def _extract_gemini_text(data: Dict[str, Any]) -> str:
    texts: List[str] = []
    for candidate in data.get("candidates") or []:
        content = candidate.get("content") or {}
        for part in content.get("parts") or []:
            text = (part or {}).get("text")
            if text:
                texts.append(text.strip())
    text = "\n".join(t for t in texts if t)
    if not text:
        raise RuntimeError("Gemini vision returned no text")
    return text


def _describe_image_gemini(image_b64: str, mime_type: str, user_query: str) -> str:
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": _request_text(user_query)},
                    {"inline_data": {"mime_type": mime_type or "image/png", "data": image_b64}},
                ]
            }
        ]
    }
    response = httpx.post(
        url=_gemini_endpoint(),
        headers=_gemini_headers(),
        params=_gemini_params(),
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    return _extract_gemini_text(response.json())


# ----- GLM / BigModel (OpenAI-compatible multimodal chat) -----
def _glm_endpoint() -> str:
    base = Config.GLM_BASE_URL.rstrip("/")
    if base.endswith("/chat/completions"):
        return base
    return base + "/chat/completions"


def _glm_headers() -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if Config.GLM_API_KEY:
        headers["Authorization"] = f"Bearer {Config.GLM_API_KEY}"
    return headers


def _extract_glm_text(data: Dict[str, Any]) -> str:
    choices = data.get("choices") or []
    texts: List[str] = []
    for choice in choices:
        message = (choice or {}).get("message") or {}
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            texts.append(content.strip())
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, dict):
                    text = part.get("text")
                    if text:
                        texts.append(str(text).strip())
    text = "\n".join(t for t in texts if t)
    if not text:
        raise RuntimeError("GLM vision returned no text")
    return text


def _describe_image_glm(image_b64: str, mime_type: str, user_query: str) -> str:
    payload = {
        "model": Config.GLM_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": _request_text(user_query)},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type or 'image/png'};base64,{image_b64}"
                        },
                    },
                ],
            }
        ],
    }
    response = httpx.post(
        url=_glm_endpoint(),
        headers=_glm_headers(),
        json=payload,
        timeout=60,
    )
    response.raise_for_status()
    return _extract_glm_text(response.json())


def describe_image(image_b64: str, mime_type: str, user_query: str) -> str:
    provider = (Config.VISION_PROVIDER or "glm").lower()
    if provider == "gemini":
        return _describe_image_gemini(image_b64, mime_type, user_query)
    if provider == "glm":
        return _describe_image_glm(image_b64, mime_type, user_query)
    raise RuntimeError(f"Unsupported GA_VISION_PROVIDER: {provider}")
