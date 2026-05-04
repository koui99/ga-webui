"use client"

import { useCallback, useEffect, useState } from "react"
import { Check, RotateCcw, Settings2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { setLLMs, useChatState, clearMessages } from "@/lib/chat/store"
import { t } from "@/lib/chat/i18n"
import { CustomLLMPanel } from "./custom-llm-panel"

interface LLMOption {
  idx: number
  name: string
  current: boolean
  custom?: boolean
}

export function ChatSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { llms, currentLLM } = useChatState()
  const { toast } = useToast()
  const [fontScale, setFontScale] = useState(100)
  const [loading, setLoading] = useState(false)

  const loadLLMs = useCallback(async (showError = false) => {
    try {
      const response = await fetch("/api/llms")
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? "加载模型列表失败")
      }
      setLLMs(data.llms ?? [], data.current ?? 0)
    } catch (error: unknown) {
      setLLMs([], 0)
      if (showError) {
        toast({
          description: error instanceof Error ? error.message : "加载模型列表失败",
          variant: "destructive",
        })
      }
    }
  }, [toast])

  // Load LLMs once on mount.
  useEffect(() => {
    void loadLLMs(true)
  }, [loadLLMs])

  // Refresh when the sidebar opens.
  useEffect(() => {
    if (!open) return
    void loadLLMs(true)
  }, [loadLLMs, open])

  // Live font scaling — applies to <html> root so all rems scale.
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontScale}%`
    return () => {
      document.documentElement.style.fontSize = ""
    }
  }, [fontScale])

  async function switchLLM(idx: number) {
    setLoading(true)
    try {
      const response = await fetch("/api/llms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idx }),
      })
      const result = await response.json().catch(() => ({}))
      if (result.ok) {
        const refreshResponse = await fetch("/api/llms")
        const refreshedData = await refreshResponse.json().catch(() => ({}))
        setLLMs(refreshedData.llms ?? [], refreshedData.current ?? idx)
        const name = refreshedData.llms?.find((item: LLMOption) => item.idx === idx)?.name ?? `#${idx}`
        toast({ description: `已切换至 ${name}` })
      } else {
        toast({ description: result.error ?? t.switchModelFailed, variant: "destructive" })
      }
    } finally {
      setLoading(false)
    }
  }

  async function reinjectSystemPrompt() {
    const response = await fetch("/api/reinject", { method: "POST" })
    const result = await response.json().catch(() => ({}))
    if (result.ok) toast({ description: t.reinjectDone })
    else toast({ description: result.error ?? t.reinjectFailed, variant: "destructive" })
  }

  return (
    <>
      {/* Backdrop on small screens */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform lg:relative lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <header className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Settings2 className="size-4 text-muted-foreground" />
            <span>设置</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label={t.closeSidebar}
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="warm-scroll flex-1 overflow-y-auto px-4 py-4">
          <Section title={t.sectionLLM}>
            <p className="mb-2 text-xs text-muted-foreground">
              当前：{" "}
              <span className="font-mono text-foreground">
                {llms.find((llm) => llm.idx === currentLLM)?.name ?? "—"}
              </span>
            </p>
            <ul className="flex flex-col gap-1">
              {llms.map((llm) => (
                <li key={llm.idx}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => switchLLM(llm.idx)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px] font-mono transition-colors",
                      llm.current
                        ? "bg-sidebar-accent text-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="text-muted-foreground/70">
                        {llm.custom ? "★" : String(llm.idx).padStart(2, " ")}
                      </span>
                      <span className="truncate">{llm.name}</span>
                      {llm.custom && (
                        <span className="shrink-0 rounded bg-[color:var(--accent-terracotta)]/15 px-1 py-0.5 text-[9.5px] font-sans text-[color:var(--accent-terracotta)]">
                          自定义
                        </span>
                      )}
                    </span>
                    {llm.current && <Check className="size-3.5 shrink-0 text-[color:var(--brand-hover)]" />}
                  </button>
                </li>
              ))}
              {llms.length === 0 && (
                <li className="text-xs text-muted-foreground">尚未加载任何后端</li>
              )}
            </ul>
            <div className="mt-3 border-t border-sidebar-border pt-3">
              <CustomLLMPanel />
            </div>
          </Section>

          <Section title={t.sectionSession}>
            <button
              type="button"
              onClick={reinjectSystemPrompt}
              className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-card px-3 py-2 text-[13px] hover:bg-sidebar-accent"
            >
              <RotateCcw className="size-3.5" />
              {t.reinjectPrompt}
            </button>
            <button
              type="button"
              onClick={() => {
                clearMessages()
                toast({ description: "已清空对话视图（服务端历史保留）" })
              }}
              className="mt-2 flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-card px-3 py-2 text-[13px] hover:bg-sidebar-accent"
            >
              <X className="size-3.5" />
              清空对话视图
            </button>
          </Section>

          <Section title={t.sectionDisplay}>
            <label className="block text-xs text-muted-foreground" htmlFor="fontScale">
              {t.fontSize} · {fontScale}%
            </label>
            <input
              id="fontScale"
              type="range"
              min={90}
              max={140}
              step={5}
              value={fontScale}
              onChange={(e) => setFontScale(Number(e.target.value))}
              className="mt-1 w-full accent-[color:var(--brand)]"
            />
          </Section>

          <Section title={t.sectionAbout}>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {"为 "}
              <a
                className="text-[color:var(--accent-terracotta)] underline underline-offset-2"
                href="https://github.com/lsdefine/GenericAgent"
                target="_blank"
                rel="noreferrer"
              >
                GenericAgent
              </a>
              {" 打造的现代 Web 界面。原 Streamlit 界面（"}
              <code className="font-mono">stapp2.py</code>
              {"）保持完整可用，零改动。"}
            </p>
            <a
              href="/downloads"
              className="mt-3 flex items-center justify-center rounded-md border border-sidebar-border bg-card px-3 py-2 text-[12px] hover:bg-sidebar-accent"
            >
              下载部署包 → 服务器
            </a>
          </Section>
        </div>
      </aside>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  )
}

