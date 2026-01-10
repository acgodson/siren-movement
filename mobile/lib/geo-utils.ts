/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 - First latitude
 * @param lon1 - First longitude
 * @param lat2 - Second latitude
 * @param lon2 - Second longitude
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Format distance for display
 * @param distance - Distance in kilometers
 * @returns Formatted distance string (e.g., "500m" or "1.5km")
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Check if user is within submission radius of a location
 * @param userLat - User latitude
 * @param userLon - User longitude
 * @param targetLat - Target latitude
 * @param targetLon - Target longitude
 * @param radiusKm - Allowed radius in kilometers (default 0.1km = 100m)
 * @returns Boolean indicating if within radius
 */
export function isWithinRadius(
  userLat: number,
  userLon: number,
  targetLat: number,
  targetLon: number,
  radiusKm: number = 0.1
): boolean {
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  return distance <= radiusKm;
}

/**
 * Get current user location with error handling
 * @returns Promise resolving to coordinates or default fallback
 */
export async function getCurrentLocation(): Promise<{
  lat: number;
  lon: number;
  error?: string;
}> {
  if (!navigator.geolocation) {
    return {
      lat: 37.7749,
      lon: -122.4194,
      error: 'Geolocation not supported',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        resolve({
          lat: 37.7749,
          lon: -122.4194,
          error: error.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}
