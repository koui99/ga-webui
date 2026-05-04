import type { NextRequest } from "next/server"
import { ADAPTER_URL, missingAdapterResponse } from "@/lib/chat/server-config"

export const runtime = "nodejs"

export async function GET() {
  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  const response = await fetch(`${ADAPTER_URL}/llms`)
  return new Response(response.body, { status: response.status, headers: { "Content-Type": "application/json" } })
}

export async function POST(req: NextRequest) {
  const { idx } = (await req.json()) as { idx: number }

  if (!ADAPTER_URL) {
    return missingAdapterResponse()
  }

  const response = await fetch(`${ADAPTER_URL}/llms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idx }),
  })
  return new Response(response.body, { status: response.status, headers: { "Content-Type": "application/json" } })
}

