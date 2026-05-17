type ResenaPayload = {
  id_viaje: string
  id_emisor: string
  id_receptor: string
  puntaje: number
  comentario: string
}

type ResenaResponse = {
  id_calificacion: string
  estado: string
  timestamp: string
}

type ReportePayload = {
  id_reportante: string
  id_calificacion: string
  motivo: string
  descripcion: string
}

type ReporteResponse = {
  id_reporte: string
  estado: string
  timestamp: string
}

function getFeedbackBaseUrl() {
  return process.env.FEEDBACK_APP_URL?.replace(/\/$/, "") ?? null
}

async function postToFeedbackApp<TResponse>(path: string, payload: unknown, fallback: () => TResponse) {
  const baseUrl = getFeedbackBaseUrl()

  if (!baseUrl) {
    return fallback()
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  // Prefer using existing internal API key header for M2M auth if available
  if (process.env.INTERNAL_API_KEY) {
    headers["x-api-key"] = process.env.INTERNAL_API_KEY
  }
  // Optionally include a dedicated feedback token as Bearer
  if (process.env.FEEDBACK_APP_TOKEN) {
    headers["Authorization"] = `Bearer ${process.env.FEEDBACK_APP_TOKEN}`
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || "No se pudo comunicar con la app de feedback")
  }

  return (await response.json()) as TResponse
}

export async function crearResena(payload: ResenaPayload): Promise<ResenaResponse> {
  return postToFeedbackApp("/api/resenas", payload, () => ({
    id_calificacion: `cal_${crypto.randomUUID()}`,
    estado: "REGISTRADA",
    timestamp: new Date().toISOString(),
  }))
}

export async function crearReporte(payload: ReportePayload): Promise<ReporteResponse> {
  return postToFeedbackApp("/api/reportes", payload, () => ({
    id_reporte: `rep_${crypto.randomUUID()}`,
    estado: "PENDIENTE",
    timestamp: new Date().toISOString(),
  }))
}