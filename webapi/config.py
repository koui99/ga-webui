import os

class Config:
    HOST = os.environ.get("GA_HOST", "127.0.0.1")
    PORT = int(os.environ.get("GA_PORT", "8765"))
    IMAGE_PROVIDER = os.environ.get("GA_IMAGE_PROVIDER", "mock").lower()
    FAL_KEY = os.environ.get("FAL_KEY", "")
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
    AI_GATEWAY_API_KEY = os.environ.get("AI_GATEWAY_API_KEY", "")

    # Web-upload image understanding provider.
    # Supported: glm (default), gemini
    VISION_PROVIDER = os.environ.get("GA_VISION_PROVIDER", "glm").lower()

    # Gemini-compatible provider (Google, proxy, etc.)
    GEMINI_BASE_URL = os.environ.get("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash-image")

    # Zhipu GLM / BigModel vision (OpenAI-compatible chat completions)
    GLM_BASE_URL = os.environ.get("GLM_BASE_URL", "https://open.bigmodel.cn/api/paas/v4")
    GLM_API_KEY = os.environ.get("GLM_API_KEY", "")
    GLM_MODEL = os.environ.get("GLM_MODEL", "glm-4v-flash")

    # CORS — Next dev server defaults
    CORS_ORIGINS = os.environ.get(
        "GA_CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")

