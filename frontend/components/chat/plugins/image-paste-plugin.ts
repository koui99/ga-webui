/**
 * Image-paste plugin.
 * Captures pasted images (and dropped image files via the input area) and
 * attaches them as base64 data URLs. The adapter forwards them to
 * `agent.put_task(query, images=[...])` — the Python side already supports
 * this parameter, so no source changes are needed.
 */

import type { InputPlugin } from "@/lib/chat/registry"

const MAX_PIXELS = 1600 // longest side
const JPEG_QUALITY = 0.88
const MAX_BYTES = 6 * 1024 * 1024

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) {
    return await readAsDataURL(file)
  }
  const scale = Math.min(1, MAX_PIXELS / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return await readAsDataURL(file)
  ctx.drawImage(bitmap, 0, 0, w, h)
  // Prefer original PNG only if small; otherwise JPEG for size.
  const url = canvas.toDataURL("image/jpeg", JPEG_QUALITY)
  if (url.length <= MAX_BYTES * 1.34) return url // base64 expansion
  return canvas.toDataURL("image/jpeg", 0.7)
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onerror = () => reject(r.error)
    r.onload = () => resolve(String(r.result ?? ""))
    r.readAsDataURL(file)
  })
}

export const ImagePastePlugin: InputPlugin = {
  id: "image-paste",
  async onPaste(e, ctx) {
    const items = e.clipboardData?.items
    if (!items) return false
    const imageItems = Array.from(items).filter((it) => it.kind === "file" && it.type.startsWith("image/"))
    if (imageItems.length === 0) return false
    e.preventDefault()
    e.stopPropagation()
    for (const it of imageItems) {
      const file = it.getAsFile()
      if (!file) continue
      try {
        const dataUrl = await fileToCompressedDataUrl(file)
        ctx.addAttachment({ kind: "image", dataUrl, name: file.name || "pasted.png", mime: "image/jpeg" })
      } catch (err) {
        ctx.toast(`粘贴失败：${String(err)}`, "error")
      }
    }
    ctx.toast("图片已添加，将随下一条消息一起发送", "ok")
    return true
  },
}

/** Helper used by the input component for drop / click-to-upload. */
export async function attachFile(file: File, ctx: { addAttachment: Parameters<NonNullable<InputPlugin["onPaste"]>>[1]["addAttachment"]; toast: Parameters<NonNullable<InputPlugin["onPaste"]>>[1]["toast"] }) {
  if (!file.type.startsWith("image/")) {
    ctx.toast(`仅支持图片格式（当前：${file.type || "未知"}）`, "warning")
    return
  }
  try {
    const dataUrl = await fileToCompressedDataUrl(file)
    ctx.addAttachment({ kind: "image", dataUrl, name: file.name, mime: "image/jpeg" })
  } catch (err) {
    ctx.toast(`添加失败：${String(err)}`, "error")
  }
}

