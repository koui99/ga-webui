"use client"

import { useCallback, useEffect, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { setLLMs } from "@/lib/chat/store"
import { t } from "@/lib/chat/i18n"
import { cn } from "@/lib/utils"

interface CustomLLM {
  id: string
  name: string
  base_url: string
  api_key: string // masked when read from server
  model: string
  enabled?: boolean
}

const blankCustomLLM: CustomLLM = { id: "", name: "", base_url: "", api_key: "", model: "", enabled: true }

export function CustomLLMPanel() {
  const { toast } = useToast()
  const [items, setItems] = useState<CustomLLM[]>([])
  const [draft, setDraft] = useState<CustomLLM | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async (showError = true) => {
    try {
      const response = await fetch("/api/custom-llms")
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error ?? "加载自定义模型失败")
      }
      setItems(data.items ?? [])

      const llmResponse = await fetch("/api/llms")
      const llmData = await llmResponse.json().catch(() => ({}))
      if (!llmResponse.ok) {
        throw new Error(llmData.error ?? "刷新模型列表失败")
      }
      setLLMs(llmData.llms ?? [], llmData.current ?? 0)
    } catch (error: unknown) {
      setItems([])
      if (showError) {
        toast({
          description: error instanceof Error ? error.message : "加载自定义模型失败",
          variant: "destructive",
        })
      }
    }
  }, [toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void reload(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [reload])

  async function save() {
    if (!draft) return
    if (!draft.name.trim() || !draft.base_url.trim() || !draft.model.trim()) {
      toast({ description: "名称、Base URL、模型 不能为空", variant: "destructive" })
      return
    }
    setBusy(true)
    try {
      const response = await fetch("/api/custom-llms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      })
      const result = await response.json().catch(() => ({}))
      if (result.ok) {
        toast({ description: t.customLLMSavedOk })
        setDraft(null)
        await reload(false)
      } else {
        toast({ description: result.error ?? t.customLLMSavedFail, variant: "destructive" })
      }
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string) {
    if (!confirm("删除此自定义 API？")) return
    setBusy(true)
    try {
      const response = await fetch(`/api/custom-llms?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "删除失败")
      }
      toast({ description: t.customLLMDeletedOk })
      await reload(false)
    } catch (error: unknown) {
      toast({
        description: error instanceof Error ? error.message : "删除失败",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      {items.length > 0 && !draft && (
        <ul className="flex flex-col gap-0.5">
          {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-center justify-between rounded px-1.5 py-1 hover:bg-sidebar-accent/60"
            >
              <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
                {it.name}
                <span className="ml-1.5 font-mono text-[10.5px] text-muted-foreground/60">
                  {it.model}
                </span>
              </span>
              <span className="flex shrink-0 gap-0.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                <button
                  type="button"
                  className="grid size-5 place-items-center rounded text-muted-foreground hover:text-foreground"
                  onClick={() => setDraft({ ...it })}
                  title={t.customLLMEdit}
                  aria-label={t.customLLMEdit}
                >
                  <Pencil className="size-3" />
                </button>
                <button
                  type="button"
                  className="grid size-5 place-items-center rounded text-muted-foreground hover:text-[color:var(--accent-terracotta)]"
                  onClick={() => remove(it.id)}
                  title={t.customLLMDelete}
                  aria-label={t.customLLMDelete}
                >
                  <Trash2 className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {draft ? (
        <div className="mt-2 flex flex-col gap-1.5 rounded-md border border-sidebar-border bg-card p-2.5">
          <Input
            placeholder={t.customLLMNamePh}
            value={draft.name}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <Input
            placeholder={t.customLLMUrlPh}
            value={draft.base_url}
            onChange={(v) => setDraft({ ...draft, base_url: v })}
            mono
          />
          <Input
            placeholder={t.customLLMKeyPh}
            value={draft.api_key}
            onChange={(v) => setDraft({ ...draft, api_key: v })}
            type="password"
            mono
          />
          <Input
            placeholder={t.customLLMModelPh}
            value={draft.model}
            onChange={(v) => setDraft({ ...draft, model: v })}
            mono
          />
          <div className="mt-1 flex justify-end gap-1.5">
            <button
              type="button"
              disabled={busy}
              onClick={() => setDraft(null)}
              className="rounded px-2.5 py-1 text-xs text-muted-foreground hover:bg-sidebar-accent"
            >
              {t.customLLMCancel}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className={cn(
                "rounded bg-[color:var(--brand)] px-3 py-1 text-xs font-medium text-white",
                "hover:bg-[color:var(--brand-hover)] disabled:opacity-50",
              )}
            >
              {t.customLLMSave}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDraft({ ...blankCustomLLM })}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-sidebar-border bg-card/50 px-3 py-2 text-[12.5px] text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
          {t.customLLMAdd}
        </button>
      )}

      {!draft && items.length === 0 && (
        <p className="mt-2 text-[10.5px] leading-relaxed text-muted-foreground/70">
          {t.customLLMHint}
        </p>
      )}
    </div>
  )
}

function Input({
  value, onChange, placeholder, type = "text", mono,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: "text" | "password"
  mono?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className={cn(
        "w-full rounded border border-sidebar-border bg-background px-2 py-1.5 text-[12.5px] outline-none transition-colors",
        "placeholder:text-muted-foreground/60 focus:border-[color:var(--brand)]",
        mono && "font-mono",
      )}
    />
  )
}

