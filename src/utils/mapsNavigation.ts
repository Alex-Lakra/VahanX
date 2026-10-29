import { VehicleType } from '../types/telemetry';

export interface RepairShopSearchParams {
  vehicleType: VehicleType;
  latitude?: number;
  longitude?: number;
}

/**
 * Launches Android native Google Maps turn-by-turn navigation intent
 * with fallback to web browser Google Maps directions.
 */
export async function openRepairNavigation(params: RepairShopSearchParams): Promise<void> {
  const isHDV = params.vehicleType === 'HDV';
  const query = isHDV
    ? 'tractor heavy equipment agricultural machinery repair workshop'
    : 'auto repair mechanic workshop';

  // If coordinates are provided, route to query near current location
  const encodedQuery = encodeURIComponent(query);
  const nativeIntentUrl = params.latitude && params.longitude
    ? `google.navigation:q=${encodedQuery}&mode=d`
    : `google.navigation:q=${encodedQuery}&mode=d`;

  const webFallbackUrl = params.latitude && params.longitude
    ? `https://www.google.com/maps/search/${encodedQuery}/@${params.latitude},${params.longitude},13z`
    : `https://www.google.com/maps/search/${encodedQuery}`;

  // Try Android native intent first
  try {
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = nativeIntentUrl;
      // Fallback timer if intent is not handled
      setTimeout(() => {
        window.open(webFallbackUrl, '_blank');
      }, 1200);
      return;
    }
  } catch (err) {
    console.warn('Native navigation intent failed, opening web fallback', err);
  }

  // Standard web browser fallback
  window.open(webFallbackUrl, '_blank');
}

