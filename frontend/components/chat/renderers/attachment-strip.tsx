"use client"

import { useState } from "react"
import Image from "next/image"
import { Download, ExternalLink, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AttachmentEvent } from "@/lib/chat/protocol"
import { t } from "@/lib/chat/i18n"

export function AttachmentStrip({
  attachments,
  className,
}: {
  attachments: AttachmentEvent[]
  className?: string
}) {
  const images = attachments.filter((a) => a.kind === "image")
  if (images.length === 0) return null
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {images.map((a) => (
        <ImageBubble key={a.id} att={a} />
      ))}
    </div>
  )
}

function ImageBubble({ att }: { att: AttachmentEvent }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <figure
        className="img-bubble group relative overflow-hidden rounded-xl border border-border bg-muted/40"
        style={{ maxWidth: 320 }}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full cursor-zoom-in"
          aria-label={att.alt ?? t.openImage}
        >
          {/* Use a plain img for data URLs / external URLs to avoid Next/Image config friction. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={att.url || "/placeholder.svg"}
            alt={att.alt ?? att.prompt ?? "image"}
            className="h-auto w-full object-cover"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
          />
        </button>
        {att.prompt && (
          <figcaption className="img-overlay pointer-events-none absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/70 via-black/40 to-transparent px-3 py-2 text-xs text-white">
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{att.prompt}</span>
          </figcaption>
        )}
        <div className="img-overlay absolute right-2 top-2 flex gap-1">
          <a
            href={att.url}
            download
            target="_blank"
            rel="noreferrer"
            className="grid size-7 place-items-center rounded-md bg-black/60 text-white hover:bg-black/80"
            aria-label={t.downloadImage}
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="size-3.5" />
          </a>
          <a
            href={att.url}
            target="_blank"
            rel="noreferrer"
            className="grid size-7 place-items-center rounded-md bg-black/60 text-white hover:bg-black/80"
            aria-label={t.openInNewTab}
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </figure>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <Image
            src={att.url || "/placeholder.svg"}
            alt={att.alt ?? att.prompt ?? "image"}
            width={1600}
            height={1600}
            className="max-h-[90vh] w-auto max-w-[90vw] rounded-lg object-contain"
            crossOrigin="anonymous"
            unoptimized
          />
        </div>
      )}
    </>
  )
}

