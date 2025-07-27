import apiClient from '../config/axios.config'
import { CreateRatingRequest, Rating, RatingQuery, UpdateRatingRequest } from '../types/rating.types'

export class RatingAPI {
  private readonly baseEndpoint = '/Rating'

  /**
   * Create a new rating
   */
  async createRating(data: CreateRatingRequest): Promise<string> {
    try {
      console.log('🌟 Creating rating:', data)
      
      // Transform field names to match backend expectations
      const backendPayload = {
        RenterId: data.renterId,
        StorageId: data.storageId,
        Star: data.star,
        Comment: data.comment
      }
      
      console.log('📤 Sending backend payload:', backendPayload)
      const response = await apiClient.post(this.baseEndpoint, backendPayload)
      console.log('✅ Rating created:', response.data)
      
      if (response.data.code === 'SUCCESS' && typeof response.data.data === 'string') {
        return response.data.data // Return the rating ID
      }
      
      throw new Error(response.data.message || 'Failed to create rating')
    } catch (error: any) {
      console.error('❌ Create rating failed:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to create rating')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Update an existing rating
   */
  async updateRating(data: UpdateRatingRequest): Promise<string> {
    try {
      console.log('🔄 Updating rating:', data)
      
      // Transform field names to match backend expectations
      const updatePayload = {
        Id: data.id,
        Star: data.star,
        Comment: data.comment
      }
      
      console.log('📤 Sending update payload:', updatePayload)
      const response = await apiClient.put(this.baseEndpoint, updatePayload)
      console.log('✅ Rating updated:', response.data)
      
      if (response.data.code === 'SUCCESS') {
        return data.id // Return the rating ID
      }
      
      throw new Error(response.data.message || 'Failed to update rating')
    } catch (error: any) {
      console.error('❌ Update rating failed:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to update rating')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Delete a rating
   */
  async deleteRating(ratingId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting rating:', ratingId)
      const response = await apiClient.delete(`${this.baseEndpoint}/${ratingId}`)
      console.log('✅ Rating deleted:', response.data)
      
      if (response.data.code !== 'SUCCESS') {
        throw new Error(response.data.message || 'Failed to delete rating')
      }
    } catch (error: any) {
      console.error('❌ Delete rating failed:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to delete rating')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Get all ratings by a user (renter)
   */
  async getUserRatings(renterId: string, query: RatingQuery = {}): Promise<Rating[]> {
    try {
      console.log('📋 Fetching user ratings for:', renterId)
      
      const params = new URLSearchParams()
      if (query.pageSize) params.append('pageSize', query.pageSize.toString())
      if (query.pageIndex) params.append('pageIndex', query.pageIndex.toString())
      
      const queryString = params.toString()
      const url = queryString ? `${this.baseEndpoint}/renter/${renterId}?${queryString}` : `${this.baseEndpoint}/renter/${renterId}`
      
      const response = await apiClient.get(url)
      console.log('✅ User ratings fetched:', response.data)
      
      if (response.data.code === 'SUCCESS') {
        console.log('🏷️ Ratings data:', response.data.data.data)
        // Handle both paginated and simple array responses
        if (response.data.data?.data && Array.isArray(response.data.data.data)) {
          return response.data.data.data
        } else if (Array.isArray(response.data.data)) {
          return response.data.data
        }
      }
      
      return []
    } catch (error: any) {
      console.error('❌ Get user ratings failed:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch user ratings')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Get all ratings for a storage
   */
  async getStorageRatings(storageId: string, query: RatingQuery = {}): Promise<Rating[]> {
    try {
      console.log('🏠 Fetching storage ratings for:', storageId)
      
      const params = new URLSearchParams()
      if (query.pageSize) params.append('pageSize', query.pageSize.toString())
      if (query.pageIndex) params.append('pageIndex', query.pageIndex.toString())
      
      const queryString = params.toString()
      const url = queryString ? `${this.baseEndpoint}/storage/${storageId}?${queryString}` : `${this.baseEndpoint}/storage/${storageId}`
      
      const response = await apiClient.get(url)
      console.log('✅ Storage ratings fetched:', response.data)
      
      if (response.data.code === 'SUCCESS') {
        // Handle both paginated and simple array responses
        if (response.data.data?.items && Array.isArray(response.data.data.items)) {
          return response.data.data.items
        } else if (Array.isArray(response.data.data)) {
          return response.data.data
        }
      }
      
      return []
    } catch (error: any) {
      console.error('❌ Get storage ratings failed:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch storage ratings')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Check if user has already rated a storage
   */
  async hasUserRatedStorage(renterId: string, storageId: string): Promise<Rating | null> {
    try {
      console.log('🔍 Checking if user has rated storage:', { renterId, storageId })
      
      // Get all ratings by the user and check if any are for this storage
      const userRatings = await this.getUserRatings(renterId, { pageSize: 100 })
      const existingRating = userRatings.find(rating => rating.storageId === storageId)
      
      console.log('✅ Rating check result:', { hasRating: !!existingRating, rating: existingRating })
      
      return existingRating || null
    } catch (error: any) {
      console.error('❌ Check user rating failed:', error)
      if (error.response?.status === 404) {
        // User hasn't rated this storage yet
        return null
      }
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to check user rating')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Get rating by ID
   */
  async getRatingById(id: string): Promise<Rating> {
    try {
      console.log('🔍 Fetching rating by ID:', id)
      const response = await apiClient.get(`${this.baseEndpoint}/${id}`)
      console.log('✅ Rating fetched:', response.data)
      
      if (response.data.code === 'SUCCESS' && response.data.data) {
        return response.data.data as Rating
      }
      
      throw new Error(response.data.message || 'Rating not found')
    } catch (error: any) {
      console.error('❌ Get rating by ID failed:', error)
      if (error.response) {
        throw new Error(error.response.data?.message || 'Failed to fetch rating')
      }
      throw new Error('Network error occurred')
    }
  }

  /**
   * Get rating statistics for a storage
   */
  async getStorageRatingStats(storageId: string): Promise<{
    averageRating: number
    totalRatings: number
    ratingDistribution: { [key: number]: number }
  }> {
    try {
      const ratings = await this.getStorageRatings(storageId, { pageSize: 1000 })
      
      const totalRatings = ratings.length
      
      if (totalRatings === 0) {
        return {
          averageRating: 0,
          totalRatings: 0,
          ratingDistribution: {},
        }
      }

      const ratingDistribution: { [key: number]: number } = {}
      let totalStars = 0

      ratings.forEach(rating => {
        totalStars += rating.star
        ratingDistribution[rating.star] = (ratingDistribution[rating.star] || 0) + 1
      })

      return {
        averageRating: Math.round((totalStars / totalRatings) * 10) / 10, // Round to 1 decimal
        totalRatings,
        ratingDistribution,
      }
    } catch (error: any) {
      console.error('❌ Failed to get storage rating statistics:', error)
      return {
        averageRating: 0,
        totalRatings: 0,
        ratingDistribution: {},
      }
    }
  }
}

export const ratingAPI = new RatingAPI()