// Debug utilities for better logging

export const cleanLog = (label: string, data: any, maxDepth = 2) => {
  try {
    // Tạo clean copy để tránh circular reference
    const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
      // Truncate long strings
      if (typeof value === 'string' && value.length > 100) {
        return value.substring(0, 100) + '...'
      }
      return value
    }))
    
    console.log(`🔍 ${label}:`, cleanData)
  } catch {
    // Fallback cho circular reference
    console.log(`🔍 ${label}:`, data?.toString?.() || 'Unable to stringify')
  }
}

export const logUserData = (user: any) => {
  if (!user) {
    console.log('❌ No user data')
    return
  }

  console.log('👤 User Summary:')
  console.log('  ID:', user.id)
  console.log('  Email:', user.email)
  console.log('  Username:', user.username)
  console.log('  Phone:', user.phoneNumber)
  console.log('  Role:', user.role)
  console.log('  Status:', user.status)
  
  if (user.renter) {
    console.log('  🏠 Renter ID:', user.renter.renterId)
  }
  
  if (user.keeper) {
    console.log('  🔒 Keeper Info:', user.keeper)
  }
}

export const logToken = (token: string) => {
  if (!token) {
    console.log('❌ No token')
    return
  }
  
  console.log('🔑 Token Info:')
  console.log('  Length:', token.length)
  console.log('  Preview:', token.substring(0, 20) + '...')
  
  // Decode JWT payload (chỉ để debug, không verify)
  try {
    const payload = token.split('.')[1]
    const decoded = JSON.parse(atob(payload))
    console.log('  Payload:', {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toLocaleString()
    })
  } catch {
    console.log('  Could not decode JWT payload')
  }
}
