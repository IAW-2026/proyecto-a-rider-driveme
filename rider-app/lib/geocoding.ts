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
