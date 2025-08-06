
import { storageAPI } from '@/hooks/api';

// Type Definitions
export interface AddressObject {
  street?: string;
  streetNumber?: string;
  name?: string;
  city?: string;
  district?: string;
  region?: string;
  subregion?: string;
  formattedAddress?: string;
}

export interface DetailedAddressResult {
  primary: string;
  secondary: string;
  fullAddress: string;
}

// Address Formatting
export const formatAddressShort = (
  addressObj: AddressObject | null | undefined, 
  maxLength: number = 45
): string => {
  if (!addressObj) return '';
  
  const { street, streetNumber, district, city, region } = addressObj;
  const parts: string[] = [];
  
  if (streetNumber && street) {
    parts.push(`${streetNumber} ${street}`);
  } else if (street) {
    parts.push(street);
  }
  
  if (district) parts.push(district);
  
  if (city) {
    const shortCity = city.includes('Hồ Chí Minh') || city.includes('Ho Chi Minh') 
      ? 'TP.HCM' 
      : city.includes('Hà Nội') 
      ? 'Hà Nội' 
      : city;
    parts.push(shortCity);
  } else if (region) {
    parts.push(region);
  }
  
  const result = parts.filter(Boolean).join(', ');
  return result.length > maxLength ? result.slice(0, maxLength - 3) + '...' : result;
};

export const formatAddressDetailed = (
  addressObj: AddressObject | null | undefined
): DetailedAddressResult => {
  if (!addressObj) {
    return { primary: 'Unknown Location', secondary: '', fullAddress: 'Unknown Location' };
  }
  
  const { street, streetNumber, name, city, district, region, subregion, formattedAddress } = addressObj;

  if (formattedAddress) {
    const addressParts = formattedAddress.split(', ');
    
    let primary = '';
    if (streetNumber && street) {
      primary = `${streetNumber} ${street}`;
    } else if (name && streetNumber) {
      primary = `${streetNumber} ${street || 'Đường Nam Cao'}`;
    } else if (addressParts[0]) {
      primary = addressParts[0];
    }

    const secondaryParts: string[] = [];
    
    if (subregion && subregion !== region) {
      secondaryParts.push(subregion.includes('Thủ Đức') ? 'TP. Thủ Đức' : subregion);
    }
    
    if (region) {
      const shortRegion = region.includes('Hồ Chí Minh') || region.includes('Ho Chi Minh') 
        ? 'TP.HCM' 
        : region.includes('Hà Nội') 
        ? 'Hà Nội' 
        : region;
      secondaryParts.push(shortRegion);
    }

    const secondary = secondaryParts.slice(0, 2).join(', ');

    return {
      primary: primary.length > 40 ? primary.slice(0, 37) + '...' : primary,
      secondary: secondary.length > 35 ? secondary.slice(0, 32) + '...' : secondary,
      fullAddress: formattedAddress
    };
  }

  let primary = (name && !name.includes('Unnamed')) 
    ? name 
    : (streetNumber && street) 
    ? `${streetNumber} ${street}` 
    : street || district || city || subregion || 'Unknown Location';

  const secondaryParts: string[] = [];
  
  if (district && !primary.includes(district)) secondaryParts.push(district);
  if (subregion && subregion !== district) secondaryParts.push(subregion);
  if (region) {
    const shortRegion = region.includes('Hồ Chí Minh') 
      ? 'TP.HCM' 
      : region.includes('Hà Nội') 
      ? 'Hà Nội' 
      : region;
    secondaryParts.push(shortRegion);
  }

  const secondary = secondaryParts.slice(0, 3).join(', ');

  return {
    primary: primary.length > 40 ? primary.slice(0, 37) + '...' : primary,
    secondary: secondary.length > 35 ? secondary.slice(0, 32) + '...' : secondary,
    fullAddress: `${primary}, ${secondary}`
  };
};


// Distance Calculations using API
export const calculateDistance = async (lat1: number, lon1: number, lat2: number, lon2: number): Promise<number> => {
  try {
    const response = await storageAPI.getDistance({
      lat1: lat1,
      lon1: lon1,
      lat2: lat2,
      lon2: lon2
    });
    
    return response.data || 0;
  } catch (error) {
    console.warn('🔄 Distance API failed:', error);
    return 0; // Return 0 if API fails
  }
};

export const filterStoragesByRadius = async <T extends { latitude: number; longitude: number }>(
  userLat: number,
  userLon: number,
  storages: T[],
  radiusKm: number
): Promise<(T & { distance: number })[]> => {
  const storagesWithDistance = await Promise.allSettled(
    storages.map(async (storage) => {
      const distance = await calculateDistance(userLat, userLon, storage.latitude, storage.longitude);
      return { ...storage, distance };
    })
  );

  const successfulResults: (T & { distance: number })[] = [];
  
  storagesWithDistance.forEach(result => {
    if (result.status === 'fulfilled' && result.value.distance > 0) {
      successfulResults.push(result.value);
    }
  });

  return successfulResults
    .filter(storage => storage.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

// Fallback calculation for sync operations (backward compatibility)
const calculateDistanceFallback = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const filterStoragesByRadiusSync = <T extends { latitude: number; longitude: number }>(
  userLat: number,
  userLon: number,
  storages: T[],
  radiusKm: number
): (T & { distance: number })[] => {
  return storages
    .map(storage => ({
      ...storage,
      distance: calculateDistanceFallback(userLat, userLon, storage.latitude, storage.longitude)
    }))
    .filter(storage => storage.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
};

// Formatting Utilities
export const formatTime = (minutes: number): string => {
  const mins = Math.floor(minutes || 0);
  if (mins < 60) return `${mins} min`;
  
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day < 10 ? '0' + day : day} ${month} ${year}`;
};

export const formatCurrency = (amount: number): string => {
  // Round up to nearest 1000 VND for cleaner display
  const roundedAmount = Math.ceil(amount / 1000) * 1000;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount);
};
