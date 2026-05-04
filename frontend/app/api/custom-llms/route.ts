import { type NextRequest, NextResponse } from "next/server"
import { ADAPTER_URL, missingAdapterResponse } from "@/lib/chat/server-config"

export const dynamic = "force-dynamic"

export type CustomLLMRecord = {
  id: string
  name: string
  base_url: string
  api_key: string
  model: string
  enabled: boolean
}

export async function GET() {
  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  try {
    const response = await fetch(`${ADAPTER_URL}/custom_llms`, { cache: "no-store" })
    return NextResponse.json(await response.json(), { status: response.status })
  } catch (error: unknown) {
    return NextResponse.json({ items: [], error: String(error) }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Partial<CustomLLMRecord>

  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  try {
    const response = await fetch(`${ADAPTER_URL}/custom_llms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    return NextResponse.json(await response.json(), { status: response.status })
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 502 })
  }
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id")
  if (!id) return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 })

  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  try {
    const response = await fetch(`${ADAPTER_URL}/custom_llms/${encodeURIComponent(id)}`, { method: "DELETE" })
    return NextResponse.json(await response.json(), { status: response.status })
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 502 })
  }
}

