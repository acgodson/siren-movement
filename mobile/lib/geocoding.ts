/**
 * In-memory cache for geocoding results
 * Key: "lat,lon" | Value: address string
 */
const geocodeCache = new Map<string, string>();

/**
 * Reverse geocode coordinates to human-readable address
 * Uses Mapbox Geocoding API with caching
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Promise resolving to address string
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      throw new Error('Mapbox token not configured');
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${token}&types=place,locality,neighborhood`
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Extract neighborhood, city, or place name
      const place = data.features[0];
      const address = place.place_name || place.text || 'Unknown location';
      geocodeCache.set(cacheKey, address);
      return address;
    }

    return 'Unknown location';
  } catch (error) {
    console.error('Geocoding error:', error);
    // Fallback to coordinates
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

/**
 * Forward geocode address to coordinates
 * @param query - Search query
 * @returns Promise resolving to array of location results
 */
export async function forwardGeocode(query: string): Promise<
  Array<{
    place_name: string;
    center: [number, number]; // [lon, lat]
  }>
> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      throw new Error('Mapbox token not configured');
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${token}&limit=5`
    );

    if (!response.ok) {
      throw new Error('Forward geocoding failed');
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('Forward geocoding error:', error);
    return [];
  }
}
