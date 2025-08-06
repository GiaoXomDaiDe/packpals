export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const formatCurrency = (amount: number): string => {
  // Round up to nearest 1000 VND for cleaner display
  const roundedAmount = Math.ceil(amount / 1000) * 1000;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(roundedAmount);
}

export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`
  }
  return `${(distance / 1000).toFixed(1)}km`
}
