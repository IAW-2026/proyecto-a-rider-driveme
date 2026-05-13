export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=ar`

  const res = await fetch(url, {
    headers: { "User-Agent": "rider-driveme-app/1.0" },
  })

  if (!res.ok) return null

  const data = await res.json()
  if (!data.length) return null

  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

export async function searchAddressSuggestions(query: string): Promise<Array<{ displayName: string; lat: number; lng: number }>> {
  if (!query || query.trim().length < 2) return []
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=ar`
  const res = await fetch(url, { headers: { "User-Agent": "rider-driveme-app/1.0" } })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((d: any) => ({
    displayName: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }))
}
