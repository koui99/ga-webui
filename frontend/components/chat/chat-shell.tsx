"use client"

import { useEffect, useState } from "react"
import { Menu } from "lucide-react"
import { ensureDefaultRenderers } from "./renderers"
import { ensureDefaultPlugins } from "./plugins"
import { ChatSidebar } from "./chat-sidebar"
import { ChatStream } from "./chat-stream"
import { ChatInput } from "./chat-input"
import { useChatState } from "@/lib/chat/store"
import { t } from "@/lib/chat/i18n"

export function ChatShell() {
  // Register defaults exactly once on mount.
  // Note: registries are module-level so HMR/StrictMode are deduped inside.
  ensureDefaultRenderers()
  ensureDefaultPlugins()

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(min-width: 1024px)").matches
  })
  const { llms, currentLLM } = useChatState()

  // Auto-open sidebar on large screens.
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px)")
    const onChange = (e: MediaQueryListEvent) => setSidebarOpen(e.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  const currentName = llms.find((llm) => llm.idx === currentLLM)?.name

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <ChatSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={t.toggleSidebar}
          >
            <Menu className="size-4" />
          </button>
          <h1 className="flex-1 text-center text-base font-semibold tracking-tight">{t.appName}</h1>
          <div className="hidden min-w-[9rem] items-center justify-end gap-1.5 sm:flex">
            <span className="size-1.5 rounded-full bg-[color:var(--brand)]" aria-hidden="true" />
            <span className="truncate font-mono text-[11px] text-muted-foreground">
              {currentName ?? "加载中…"}
            </span>
          </div>
        </header>

        <ChatStream />
        <ChatInput />
      </main>
    </div>
  )
}

