const TARIFA_BASE_PESOS = 500
const TARIFA_POR_KM_PESOS = 1200

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function calcularPrecioEstimado(distanciaKm: number): number {
  return Math.round((TARIFA_BASE_PESOS + distanciaKm * TARIFA_POR_KM_PESOS) * 100) / 100
}
