/**
 * Haversine formula to calculate distance between two coordinates
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point  
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
}

/**
 * Filter storages within a given radius
 * @param userLat User's latitude
 * @param userLon User's longitude
 * @param storages Array of storage locations
 * @param radiusKm Radius in kilometers
 * @returns Filtered storages with distance property
 */
export const filterStoragesByRadius = <T extends { latitude: number; longitude: number }>(
    userLat: number,
    userLon: number,
    storages: T[],
    radiusKm: number
): (T & { distance: number })[] => {
    return storages
        .map(storage => ({
            ...storage,
            distance: calculateDistance(userLat, userLon, storage.latitude, storage.longitude)
        }))
        .filter(storage => storage.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance)
}