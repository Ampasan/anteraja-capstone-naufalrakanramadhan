export interface ReverseGeocodeResult {
  label: string;
  road?: string;
  suburb?: string;
  city?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: {
    road?: string;
    pedestrian?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    county?: string;
  };
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodeResult> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    format: 'jsonv2',
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
    signal,
    headers: { Accept: 'application/json', 'Accept-Language': 'id' },
  });
  if (!response.ok) throw new Error('Lokasi GPS tidak dapat diterjemahkan.');

  const payload = (await response.json()) as NominatimResponse;
  const address = payload.address;
  const road = address?.road ?? address?.pedestrian;
  const city = address?.city ?? address?.town ?? address?.county;
  const label = [road, address?.neighbourhood ?? address?.suburb, city]
    .filter(Boolean)
    .join(', ') || payload.display_name;

  if (!label) throw new Error('Nama lokasi tidak tersedia.');
  return { label, road, suburb: address?.suburb, city };
}
