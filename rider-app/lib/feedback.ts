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

type CalificacionDetalle = {
  id_calificacion: string
  id_viaje: string
  puntaje: number
  comentario: string
  id_emisor: string
  timestamp: string
}

export type CalificacionesUsuarioResponse = {
  id_usuario: string
  calificacion_promedio: number
  total_calificaciones: number
  detalles: CalificacionDetalle[]
}

function getFeedbackBaseUrl() {
  return process.env.FEEDBACK_APP_URL?.replace(/\/$/, "") ?? null
}

function buildFeedbackHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (process.env.FEEDBACK_SERVICE_SECRET) {
    headers["x-api-key"] = process.env.FEEDBACK_SERVICE_SECRET
  }

  return headers
}

async function requestFeedbackApp<TResponse>(
  path: string,
  init: RequestInit,
  fallback: () => TResponse
) {
  const baseUrl = getFeedbackBaseUrl()

  if (!baseUrl) {
    return fallback()
  }

  const response = await fetch(`${baseUrl}${path}`, init)

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || "No se pudo comunicar con la app de feedback")
  }

  return (await response.json()) as TResponse
}

export async function crearResena(payload: ResenaPayload): Promise<ResenaResponse> {
  return requestFeedbackApp(
    "/api/resenas",
    {
      method: "POST",
      headers: buildFeedbackHeaders(),
      body: JSON.stringify(payload),
    },
    () => ({
      id_calificacion: `cal_${crypto.randomUUID()}`,
      estado: "REGISTRADA",
      timestamp: new Date().toISOString(),
    })
  )
}

export async function crearReporte(payload: ReportePayload): Promise<ReporteResponse> {
  return requestFeedbackApp(
    "/api/reportes",
    {
      method: "POST",
      headers: buildFeedbackHeaders(),
      body: JSON.stringify(payload),
    },
    () => ({
      id_reporte: `rep_${crypto.randomUUID()}`,
      estado: "PENDIENTE",
      timestamp: new Date().toISOString(),
    })
  )
}

export async function obtenerCalificacionesUsuario(idUsuario: string): Promise<CalificacionesUsuarioResponse> {
  return requestFeedbackApp(
    `/api/usuarios/${encodeURIComponent(idUsuario)}/calificaciones`,
    {
      method: "GET",
      headers: buildFeedbackHeaders(),
    },
    () => ({
      id_usuario: idUsuario,
      calificacion_promedio: 0,
      total_calificaciones: 0,
      detalles: [],
    })
  )
}