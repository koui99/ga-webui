/**
 * Server-side config. The frontend always talks to /api/* on its own origin,
 * which then forwards to the Python adapter. The adapter URL is configurable.
 *
 * Set GENERIC_AGENT_API_URL to your adapter's address (e.g. http://127.0.0.1:18600).
 */

export const ADAPTER_URL = process.env.GENERIC_AGENT_API_URL?.replace(/\/$/, "") ?? ""

export function missingAdapterResponse() {
  return Response.json(
    {
      ok: false,
      error: "GENERIC_AGENT_API_URL is not configured",
    },
    { status: 503 },
  )
}

