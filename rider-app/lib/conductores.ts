export interface ConductorDetalle {
  id: string
  nombre: string
  fotoUrl: string | null
  patente: string
  calificacionPromedio: number
  etaLlegadaMinutos: number
}

export async function getConductorById(id: string): Promise<ConductorDetalle | null> {
  if (!id) return null

  const driverAppUrl = process.env.DRIVER_APP_URL
  if (!driverAppUrl) return null

  try {
    const res = await fetch(`${driverAppUrl}/api/conductores/${id}`, {
      headers: { "x-api-key": process.env.DRIVER_SERVICE_SECRET ?? "" },
      next: { revalidate: 30 },
    })
    if (res.ok) {
      return await res.json()
    }
  } catch (error) {
    console.error("Error fetching conductor from Driver App:", error)
  }

  return null
}