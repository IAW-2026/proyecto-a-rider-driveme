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

  return {
    id,
    nombre: "Carlos Gómez",
    fotoUrl: null,
    patente: "ABC-123",
    calificacionPromedio: 4.8,
    etaLlegadaMinutos: 5,
  }
}