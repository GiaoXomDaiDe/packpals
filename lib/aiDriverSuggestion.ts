export interface Driver {
    id: number
    first_name: string
    last_name: string
    profile_image_url?: string
    car_image_url?: string
    car_seats: number
    rating: number
    clerk_user_id: string
    // These would come from location tracking or be added to DB
    current_latitude?: number
    current_longitude?: number
    is_available?: boolean
}

export interface RideRequest {
    pickup_latitude: number
    pickup_longitude: number
    destination_latitude: number
    destination_longitude: number
    passenger_count: number
    user_id: string
    preferred_rating?: number
    max_price?: number
    time_of_day: string
}

export interface DriverSuggestion {
    driver: Driver
    score: number
    distance_km: number
    estimated_arrival_minutes: number
    estimated_price: number
    reasons: string[]
}

export class AIDriverSuggestionService {
    /**
     * Main AI suggestion function
     */
    static async suggestDrivers(
        request: RideRequest,
        availableDrivers: Driver[]
    ): Promise<DriverSuggestion[]> {
        // Phase 1: Basic filtering
        const eligibleDrivers = this.filterEligibleDrivers(
            request,
            availableDrivers
        )

        // Phase 2: AI Scoring
        const scoredDrivers = await this.scoreDrivers(request, eligibleDrivers)

        // Phase 3: Ranking
        const rankedDrivers = scoredDrivers
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // Top 5 suggestions

        return rankedDrivers
    }

    /**
     * Enhanced AI suggestion function with user preferences
     */
    static async suggestDriversWithPreferences(
        request: RideRequest,
        availableDrivers: Driver[],
        userPreferences: any
    ): Promise<DriverSuggestion[]> {
        // Phase 1: Basic filtering with user preferences
        const eligibleDrivers = this.filterEligibleDriversWithPreferences(
            request,
            availableDrivers,
            userPreferences
        )

        // Phase 2: AI Scoring with personalization
        const scoredDrivers = await this.scoreDriversWithPreferences(
            request,
            eligibleDrivers,
            userPreferences
        )

        // Phase 3: Ranking with preference weighting
        const rankedDrivers = scoredDrivers
            .sort((a, b) => b.score - a.score)
            .slice(0, 5) // Top 5 suggestions

        return rankedDrivers
    }

    /**
     * Filter drivers based on basic requirements
     */
    private static filterEligibleDrivers(
        request: RideRequest,
        drivers: Driver[]
    ): Driver[] {
        return drivers.filter((driver) => {
            // Check availability
            if (!driver.is_available) return false

            // Check car capacity
            if (driver.car_seats < request.passenger_count) return false

            // Check minimum rating if specified
            if (
                request.preferred_rating &&
                driver.rating < request.preferred_rating
            )
                return false

            // Check if driver has location data
            if (!driver.current_latitude || !driver.current_longitude)
                return false

            return true
        })
    }

    /**
     * Filter drivers based on user preferences
     */
    private static filterEligibleDriversWithPreferences(
        request: RideRequest,
        drivers: Driver[],
        userPreferences: any
    ): Driver[] {
        return drivers.filter((driver) => {
            // Basic filtering
            if (!driver.is_available) return false
            if (driver.car_seats < request.passenger_count) return false
            if (!driver.current_latitude || !driver.current_longitude)
                return false

            // User preference filtering
            const [minRating, maxRating] = userPreferences.preferredRatingRange
            if (driver.rating < minRating) return false

            // Distance filtering based on user patterns
            const distance = this.calculateDistance(
                request.pickup_latitude,
                request.pickup_longitude,
                driver.current_latitude,
                driver.current_longitude
            )

            // Filter out drivers too far based on user's average ride distance
            if (userPreferences.averageRideDistance > 0) {
                const maxDistance = Math.max(
                    10,
                    userPreferences.averageRideDistance * 1.5
                )
                if (distance > maxDistance) return false
            }

            return true
        })
    }

    /**
     * AI scoring algorithm for drivers
     */
    private static async scoreDrivers(
        request: RideRequest,
        drivers: Driver[]
    ): Promise<DriverSuggestion[]> {
        const suggestions: DriverSuggestion[] = []

        for (const driver of drivers) {
            const suggestion = await this.calculateDriverScore(request, driver)
            suggestions.push(suggestion)
        }

        return suggestions
    }

    /**
     * Enhanced AI scoring algorithm with user preferences
     */
    private static async scoreDriversWithPreferences(
        request: RideRequest,
        drivers: Driver[],
        userPreferences: any
    ): Promise<DriverSuggestion[]> {
        const suggestions: DriverSuggestion[] = []

        for (const driver of drivers) {
            const suggestion = await this.calculateDriverScoreWithPreferences(
                request,
                driver,
                userPreferences
            )
            suggestions.push(suggestion)
        }

        return suggestions
    }

    /**
     * Calculate individual driver score using AI logic
     */
    private static async calculateDriverScore(
        request: RideRequest,
        driver: Driver
    ): Promise<DriverSuggestion> {
        const reasons: string[] = []
        let score = 0

        // 1. Distance Score (40% weight)
        const distance = this.calculateDistance(
            request.pickup_latitude,
            request.pickup_longitude,
            driver.current_latitude!,
            driver.current_longitude!
        )

        const distanceScore = Math.max(0, 100 - distance * 10) // Closer = higher score
        score += distanceScore * 0.4

        if (distance < 2) {
            reasons.push('Very close to your location')
        } else if (distance < 5) {
            reasons.push('Close to your location')
        }

        // 2. Rating Score (30% weight)
        const ratingScore = (driver.rating / 5) * 100
        score += ratingScore * 0.3

        if (driver.rating >= 4.8) {
            reasons.push(
                'Excellent rating (⭐ ' + driver.rating.toFixed(1) + ')'
            )
        } else if (driver.rating >= 4.5) {
            reasons.push('Great rating (⭐ ' + driver.rating.toFixed(1) + ')')
        }

        // 3. Car Capacity Optimization (15% weight)
        const capacityScore = this.calculateCapacityScore(
            request.passenger_count,
            driver.car_seats
        )
        score += capacityScore * 0.15

        if (driver.car_seats === request.passenger_count) {
            reasons.push('Perfect car size for your group')
        } else if (driver.car_seats > request.passenger_count) {
            reasons.push('Spacious vehicle')
        }

        // 4. Time-based factors (10% weight)
        const timeScore = this.calculateTimeScore(request.time_of_day)
        score += timeScore * 0.1

        // 5. User preference learning (5% weight) - placeholder for future ML
        const preferenceScore = await this.calculateUserPreferenceScore(
            request.user_id,
            driver
        )
        score += preferenceScore * 0.05

        // Calculate estimates
        const estimatedArrival = Math.ceil(distance * 2) // 2 minutes per km estimate
        const estimatedPrice = this.calculatePrice(
            distance,
            request.time_of_day
        )

        return {
            driver,
            score: Math.round(score),
            distance_km: Math.round(distance * 10) / 10,
            estimated_arrival_minutes: estimatedArrival,
            estimated_price: estimatedPrice,
            reasons,
        }
    }

    /**
     * Calculate driver score with user preferences
     */
    private static async calculateDriverScoreWithPreferences(
        request: RideRequest,
        driver: Driver,
        userPreferences: any
    ): Promise<DriverSuggestion> {
        const reasons: string[] = []
        let score = 0

        // 1. Distance Score (35% weight - reduced for personalization)
        const distance = this.calculateDistance(
            request.pickup_latitude,
            request.pickup_longitude,
            driver.current_latitude!,
            driver.current_longitude!
        )

        const distanceScore = Math.max(0, 100 - distance * 10)
        score += distanceScore * 0.35

        if (distance < 2) {
            reasons.push('Very close to your location')
        } else if (distance < 5) {
            reasons.push('Close to your location')
        }

        // 2. Rating Score with user preference weighting (25% weight)
        const ratingCompatibility = this.calculateRatingCompatibility(
            driver.rating,
            userPreferences.preferredRatingRange
        )
        score += ratingCompatibility * 0.25

        if (driver.rating >= 4.8) {
            reasons.push(
                'Excellent rating (⭐ ' + driver.rating.toFixed(1) + ')'
            )
        } else if (driver.rating >= 4.5) {
            reasons.push('Great rating (⭐ ' + driver.rating.toFixed(1) + ')')
        }

        // 3. Car Size Compatibility (15% weight)
        const carSizeCompatibility = this.calculateCarSizeCompatibility(
            driver.car_seats,
            userPreferences.preferredCarSize
        )
        score += carSizeCompatibility * 0.15

        if (driver.car_seats === userPreferences.preferredCarSize) {
            reasons.push('Perfect car size match')
        }

        // 4. Driver Loyalty Bonus (15% weight)
        const loyaltyScore = userPreferences.driverLoyalty[driver.id] || 0
        score += loyaltyScore * 0.15

        if (loyaltyScore > 80) {
            reasons.push('Your preferred driver!')
        } else if (loyaltyScore > 50) {
            reasons.push("You've ridden with this driver before")
        }

        // 5. Time Pattern Compatibility (10% weight)
        const currentHour = new Date(request.time_of_day).getHours()
        const timeOfDay = this.getTimeOfDay(currentHour)
        const timeCompatibility = userPreferences.timePatterns[timeOfDay] || 0.5
        score += timeCompatibility * 100 * 0.1

        if (timeCompatibility > 0.7) {
            reasons.push('Matches your usual ride time')
        }

        // Calculate enhanced pricing with user preferences
        const dynamicPricing = await this.calculateDynamicPricing(
            request,
            distance
        )
        const estimatedPrice = dynamicPricing.dynamicPrice

        // Apply price sensitivity adjustment
        if (
            userPreferences.priceSensitivity > 0.7 &&
            dynamicPricing.savingsPercent
        ) {
            score += 10 // Boost score for price-sensitive users when there are savings
            reasons.push(`${dynamicPricing.savingsPercent}% savings`)
        }

        const estimatedArrival = Math.ceil(distance * 2)

        return {
            driver,
            score: Math.round(score),
            distance_km: Math.round(distance * 10) / 10,
            estimated_arrival_minutes: estimatedArrival,
            estimated_price: estimatedPrice,
            reasons,
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private static calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371 // Earth's radius in kilometers
        const dLat = this.toRadians(lat2 - lat1)
        const dLon = this.toRadians(lon2 - lon1)

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) *
                Math.cos(this.toRadians(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2)

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const distance = R * c

        return distance
    }

    private static toRadians(degrees: number): number {
        return degrees * (Math.PI / 180)
    }

    /**
     * Calculate capacity optimization score
     */
    private static calculateCapacityScore(
        passengers: number,
        carSeats: number
    ): number {
        if (carSeats < passengers) return 0
        if (carSeats === passengers) return 100
        if (carSeats === passengers + 1) return 90
        return Math.max(50, 100 - (carSeats - passengers) * 10)
    }

    /**
     * Calculate time-based scoring
     */
    private static calculateTimeScore(timeOfDay: string): number {
        const hour = new Date(timeOfDay).getHours()

        // Rush hours get lower scores (more demand)
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
            return 60
        }

        // Late night
        if (hour >= 22 || hour <= 5) {
            return 80
        }

        // Normal hours
        return 100
    }

    /**
     * Calculate price estimate
     */
    private static calculatePrice(distance: number, timeOfDay: string): number {
        const basePrice = 20000 // 20k VND base
        const pricePerKm = 8000 // 8k VND per km
        const hour = new Date(timeOfDay).getHours()

        let price = basePrice + distance * pricePerKm

        // Rush hour surge pricing
        if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
            price *= 1.3
        }

        // Late night pricing
        if (hour >= 22 || hour <= 5) {
            price *= 1.2
        }

        return Math.round(price)
    }

    /**
     * Advanced ML-based user preference learning
     */
    private static async calculateUserPreferenceScore(
        userId: string,
        driver: Driver
    ): Promise<number> {
        try {
            // Analyze user's ride history and preferences
            const userPreferences = await this.analyzeUserPreferences(userId)
            const driverCompatibility = await this.calculateDriverCompatibility(
                userPreferences,
                driver
            )

            return driverCompatibility
        } catch (error) {
            console.error('Error calculating user preference score:', error)
            return 70 // Default neutral score
        }
    }

    /**
     * Analyze user's historical preferences using machine learning
     */
    private static async analyzeUserPreferences(userId: string): Promise<{
        preferredRatingRange: [number, number]
        preferredCarSize: number
        averageRideDistance: number
        timePatterns: { [key: string]: number }
        driverLoyalty: { [key: number]: number }
        pricesensitivity: number
    }> {
        // In a real implementation, this would fetch from your database
        // For now, we'll return intelligent defaults based on common patterns
        return {
            preferredRatingRange: [4.5, 5.0],
            preferredCarSize: 4,
            averageRideDistance: 8.5,
            timePatterns: {
                morning: 0.7,
                afternoon: 0.5,
                evening: 0.8,
                night: 0.3,
            },
            driverLoyalty: {},
            pricesensitivity: 0.6, // 0 = price insensitive, 1 = very price sensitive
        }
    }

    /**
     * Calculate driver compatibility with user preferences
     */
    private static async calculateDriverCompatibility(
        preferences: any,
        driver: Driver
    ): Promise<number> {
        let compatibilityScore = 0
        let totalWeight = 0

        // Rating compatibility (40% weight)
        const ratingWeight = 0.4
        const ratingCompatibility = this.calculateRatingCompatibility(
            driver.rating,
            preferences.preferredRatingRange
        )
        compatibilityScore += ratingCompatibility * ratingWeight
        totalWeight += ratingWeight

        // Car size compatibility (30% weight)
        const carSizeWeight = 0.3
        const carSizeCompatibility = this.calculateCarSizeCompatibility(
            driver.car_seats,
            preferences.preferredCarSize
        )
        compatibilityScore += carSizeCompatibility * carSizeWeight
        totalWeight += carSizeWeight

        // Driver loyalty bonus (20% weight)
        const loyaltyWeight = 0.2
        const loyaltyScore = preferences.driverLoyalty[driver.id] || 0
        compatibilityScore += loyaltyScore * loyaltyWeight
        totalWeight += loyaltyWeight

        // Time pattern compatibility (10% weight)
        const timeWeight = 0.1
        const currentHour = new Date().getHours()
        const timeOfDay = this.getTimeOfDay(currentHour)
        const timeCompatibility = preferences.timePatterns[timeOfDay] || 0.5
        compatibilityScore += timeCompatibility * 100 * timeWeight
        totalWeight += timeWeight

        return Math.round((compatibilityScore / totalWeight) * 100)
    }

    /**
     * Calculate rating compatibility score
     */
    private static calculateRatingCompatibility(
        driverRating: number,
        preferredRange: [number, number]
    ): number {
        const [minRating, maxRating] = preferredRange

        if (driverRating >= minRating && driverRating <= maxRating) {
            return 100
        } else if (driverRating < minRating) {
            return Math.max(0, 100 - (minRating - driverRating) * 40)
        } else {
            return Math.max(60, 100 - (driverRating - maxRating) * 20)
        }
    }

    /**
     * Calculate car size compatibility score
     */
    private static calculateCarSizeCompatibility(
        carSeats: number,
        preferredSize: number
    ): number {
        if (carSeats === preferredSize) {
            return 100
        } else if (Math.abs(carSeats - preferredSize) === 1) {
            return 85
        } else if (Math.abs(carSeats - preferredSize) === 2) {
            return 70
        } else {
            return 50
        }
    }

    /**
     * Get time of day category
     */
    private static getTimeOfDay(hour: number): string {
        if (hour >= 6 && hour < 12) return 'morning'
        if (hour >= 12 && hour < 17) return 'afternoon'
        if (hour >= 17 && hour < 22) return 'evening'
        return 'night'
    }

    /**
     * Advanced context-aware scoring with seasonal and weather factors
     */
    static async getContextualScoring(request: RideRequest): Promise<{
        timeMultiplier: number
        weatherMultiplier: number
        demandMultiplier: number
        contextFactors: string[]
    }> {
        const contextFactors: string[] = []
        let timeMultiplier = 1.0
        let weatherMultiplier = 1.0
        let demandMultiplier = 1.0

        // Time-based contextual factors
        const hour = new Date(request.time_of_day).getHours()
        const dayOfWeek = new Date(request.time_of_day).getDay()

        // Weekend vs weekday patterns
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            if (hour >= 22 || hour <= 4) {
                timeMultiplier = 1.3
                contextFactors.push('Weekend late night - Premium pricing')
            } else {
                timeMultiplier = 0.9
                contextFactors.push('Weekend daytime - Relaxed pricing')
            }
        } else {
            // Weekday patterns
            if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
                timeMultiplier = 1.5
                demandMultiplier = 1.4
                contextFactors.push('Rush hour - High demand')
            } else if (hour >= 10 && hour <= 16) {
                timeMultiplier = 0.8
                contextFactors.push('Off-peak hours - Lower pricing')
            }
        }

        // Simulated weather impact (in real app, use weather API)
        const weatherCondition = this.getSimulatedWeather()
        switch (weatherCondition) {
            case 'rain':
                weatherMultiplier = 1.4
                contextFactors.push('Rainy weather - Increased demand')
                break
            case 'storm':
                weatherMultiplier = 1.8
                contextFactors.push('Storm conditions - Premium rates')
                break
            case 'sunny':
                weatherMultiplier = 1.0
                break
        }

        return {
            timeMultiplier,
            weatherMultiplier,
            demandMultiplier,
            contextFactors,
        }
    }

    /**
     * Simulate weather conditions (replace with real weather API)
     */
    private static getSimulatedWeather(): 'sunny' | 'rain' | 'storm' {
        const conditions = ['sunny', 'sunny', 'sunny', 'rain', 'storm']
        return conditions[Math.floor(Math.random() * conditions.length)] as
            | 'sunny'
            | 'rain'
            | 'storm'
    }

    /**
     * Dynamic pricing with AI-powered demand prediction
     */
    static async calculateDynamicPricing(
        request: RideRequest,
        distance: number
    ): Promise<{
        basePrice: number
        dynamicPrice: number
        priceFactors: string[]
        savingsPercent?: number
    }> {
        const basePrice = 20000 + distance * 8000
        const contextualScoring = await this.getContextualScoring(request)
        const priceFactors: string[] = [...contextualScoring.contextFactors]

        let dynamicPrice = basePrice

        // Apply contextual multipliers
        dynamicPrice *= contextualScoring.timeMultiplier
        dynamicPrice *= contextualScoring.weatherMultiplier
        dynamicPrice *= contextualScoring.demandMultiplier

        // Distance-based discounts for longer rides
        if (distance > 15) {
            dynamicPrice *= 0.9
            priceFactors.push('Long distance discount (10%)')
        }

        // Loyalty discount simulation
        if (Math.random() > 0.7) {
            dynamicPrice *= 0.95
            priceFactors.push('Loyalty discount (5%)')
        }

        const savingsPercent =
            dynamicPrice < basePrice
                ? Math.round((1 - dynamicPrice / basePrice) * 100)
                : undefined

        return {
            basePrice: Math.round(basePrice),
            dynamicPrice: Math.round(dynamicPrice),
            priceFactors,
            savingsPercent,
        }
    }
}
