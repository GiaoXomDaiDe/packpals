import { neon } from '@neondatabase/serverless'

export interface RideFeedback {
    rideId: string
    userId: string
    driverId: number
    userRating: number
    aiScore: number
    wasAiRecommended: boolean
    selectedFromPosition: number // 1st, 2nd, 3rd choice etc.
    userSatisfaction:
        | 'very_satisfied'
        | 'satisfied'
        | 'neutral'
        | 'dissatisfied'
        | 'very_dissatisfied'
    feedbackText?: string
    contextFactors: string[]
    priceAcceptance: 'too_expensive' | 'fair' | 'good_value'
    timeAcceptance: 'too_long' | 'acceptable' | 'very_fast'
}

export interface LearningMetrics {
    aiAccuracy: number
    userSatisfactionRate: number
    recommendationClickThroughRate: number
    priceAcceptanceRate: number
    timeAcceptanceRate: number
    averageSelectedPosition: number
    mostCommonReasons: string[]
    improvementAreas: string[]
}

export class AILearningService {
    /**
     * Record user feedback for machine learning improvement
     */
    static async recordRideFeedback(feedback: RideFeedback): Promise<void> {
        try {
            const sql = neon(`${process.env.DATABASE_URL}`)

            // Store detailed feedback for ML training
            await sql`
                INSERT INTO ride_feedback (
                    ride_id, user_id, driver_id, user_rating, ai_score,
                    was_ai_recommended, selected_from_position, user_satisfaction,
                    feedback_text, context_factors, price_acceptance, time_acceptance,
                    created_at
                )
                VALUES (
                    ${feedback.rideId}, ${feedback.userId}, ${feedback.driverId},
                    ${feedback.userRating}, ${feedback.aiScore}, ${feedback.wasAiRecommended},
                    ${feedback.selectedFromPosition}, ${feedback.userSatisfaction},
                    ${feedback.feedbackText || null}, ${JSON.stringify(feedback.contextFactors)},
                    ${feedback.priceAcceptance}, ${feedback.timeAcceptance}, CURRENT_TIMESTAMP
                )
            `

            // Update user preferences based on feedback
            await this.updateUserPreferencesFromFeedback(sql, feedback)

            // Update AI model weights (simplified version)
            await this.updateAIModelWeights(sql, feedback)
        } catch (error) {
            console.error('Error recording ride feedback:', error)
        }
    }

    /**
     * Update user preferences based on ride feedback
     */
    private static async updateUserPreferencesFromFeedback(
        sql: any,
        feedback: RideFeedback
    ): Promise<void> {
        try {
            // Get driver details for this ride
            const driverDetails = await sql`
                SELECT rating, car_seats FROM drivers WHERE id = ${feedback.driverId}
            `

            if (driverDetails.length === 0) return

            const driver = driverDetails[0]

            // Adjust user preferences based on satisfaction
            const satisfactionWeight = this.getSatisfactionWeight(
                feedback.userSatisfaction
            )

            // Update rating preferences
            if (
                feedback.userSatisfaction === 'very_satisfied' ||
                feedback.userSatisfaction === 'satisfied'
            ) {
                // User was happy, reinforce this driver's characteristics
                await this.reinforcePreference(
                    sql,
                    feedback.userId,
                    'preferred_rating',
                    driver.rating,
                    satisfactionWeight
                )
                await this.reinforcePreference(
                    sql,
                    feedback.userId,
                    'preferred_car_size',
                    driver.car_seats,
                    satisfactionWeight
                )
            } else if (
                feedback.userSatisfaction === 'dissatisfied' ||
                feedback.userSatisfaction === 'very_dissatisfied'
            ) {
                // User was unhappy, learn to avoid these characteristics
                await this.penalizePreference(
                    sql,
                    feedback.userId,
                    'preferred_rating',
                    driver.rating,
                    satisfactionWeight
                )
            }

            // Update price sensitivity based on price acceptance
            await this.updatePriceSensitivity(
                sql,
                feedback.userId,
                feedback.priceAcceptance
            )

            // Update driver loyalty scores
            await this.updateDriverLoyalty(
                sql,
                feedback.userId,
                feedback.driverId,
                satisfactionWeight
            )
        } catch (error) {
            console.error(
                'Error updating user preferences from feedback:',
                error
            )
        }
    }

    /**
     * Update AI model weights based on feedback
     */
    private static async updateAIModelWeights(
        sql: any,
        feedback: RideFeedback
    ): Promise<void> {
        try {
            // Simplified weight updating - in production, this would use more sophisticated ML
            const accuracyScore = this.calculateAccuracyScore(feedback)

            // Store weight adjustments
            await sql`
                INSERT INTO ai_model_adjustments (
                    feature_type, adjustment_value, accuracy_score, 
                    user_satisfaction, created_at
                )
                VALUES (
                    'recommendation_accuracy', ${accuracyScore}, ${feedback.aiScore},
                    ${feedback.userSatisfaction}, CURRENT_TIMESTAMP
                )
            `

            // Update global model weights (aggregated)
            await this.updateGlobalWeights(sql, feedback)
        } catch (error) {
            console.error('Error updating AI model weights:', error)
        }
    }

    /**
     * Calculate accuracy score for AI recommendation
     */
    private static calculateAccuracyScore(feedback: RideFeedback): number {
        let score = 50 // Base score

        // Satisfaction contribution (40% weight)
        const satisfactionScores = {
            very_satisfied: 100,
            satisfied: 80,
            neutral: 50,
            dissatisfied: 20,
            very_dissatisfied: 0,
        }
        score += (satisfactionScores[feedback.userSatisfaction] - 50) * 0.4

        // Position selected contribution (30% weight)
        const positionPenalty = Math.max(
            0,
            (feedback.selectedFromPosition - 1) * 10
        )
        score -= positionPenalty * 0.3

        // AI vs user rating alignment (30% weight)
        const ratingAlignment = Math.abs(
            feedback.aiScore - feedback.userRating * 20
        )
        score -= ratingAlignment * 0.3

        return Math.max(0, Math.min(100, score))
    }

    /**
     * Get satisfaction weight for preference updates
     */
    private static getSatisfactionWeight(
        satisfaction: RideFeedback['userSatisfaction']
    ): number {
        const weights = {
            very_satisfied: 1.0,
            satisfied: 0.7,
            neutral: 0.0,
            dissatisfied: -0.5,
            very_dissatisfied: -1.0,
        }
        return weights[satisfaction]
    }

    /**
     * Reinforce positive preferences
     */
    private static async reinforcePreference(
        sql: any,
        userId: string,
        preferenceType: string,
        value: number,
        weight: number
    ): Promise<void> {
        await sql`
            INSERT INTO user_preference_adjustments (
                user_id, preference_type, preference_value, 
                adjustment_weight, adjustment_type, created_at
            )
            VALUES (
                ${userId}, ${preferenceType}, ${value}, 
                ${weight}, 'reinforce', CURRENT_TIMESTAMP
            )
        `
    }

    /**
     * Penalize negative preferences
     */
    private static async penalizePreference(
        sql: any,
        userId: string,
        preferenceType: string,
        value: number,
        weight: number
    ): Promise<void> {
        await sql`
            INSERT INTO user_preference_adjustments (
                user_id, preference_type, preference_value, 
                adjustment_weight, adjustment_type, created_at
            )
            VALUES (
                ${userId}, ${preferenceType}, ${value}, 
                ${Math.abs(weight)}, 'penalize', CURRENT_TIMESTAMP
            )
        `
    }

    /**
     * Update price sensitivity based on feedback
     */
    private static async updatePriceSensitivity(
        sql: any,
        userId: string,
        priceAcceptance: RideFeedback['priceAcceptance']
    ): Promise<void> {
        const adjustments = {
            too_expensive: 0.1, // Increase price sensitivity
            fair: 0.0, // No change
            good_value: -0.05, // Decrease price sensitivity
        }

        const adjustment = adjustments[priceAcceptance]
        if (adjustment !== 0) {
            await sql`
                INSERT INTO user_preference_adjustments (
                    user_id, preference_type, preference_value, 
                    adjustment_weight, adjustment_type, created_at
                )
                VALUES (
                    ${userId}, 'price_sensitivity', ${adjustment}, 
                    1.0, 'adjust', CURRENT_TIMESTAMP
                )
            `
        }
    }

    /**
     * Update driver loyalty scores
     */
    private static async updateDriverLoyalty(
        sql: any,
        userId: string,
        driverId: number,
        satisfactionWeight: number
    ): Promise<void> {
        const loyaltyAdjustment = satisfactionWeight * 10 // Scale to 0-10 range

        await sql`
            INSERT INTO user_preference_adjustments (
                user_id, preference_type, preference_value, 
                adjustment_weight, adjustment_type, driver_id, created_at
            )
            VALUES (
                ${userId}, 'driver_loyalty', ${loyaltyAdjustment}, 
                1.0, 'loyalty_update', ${driverId}, CURRENT_TIMESTAMP
            )
        `
    }

    /**
     * Update global AI model weights
     */
    private static async updateGlobalWeights(
        sql: any,
        feedback: RideFeedback
    ): Promise<void> {
        // Simplified global weight updating
        const features = ['distance', 'rating', 'car_size', 'loyalty', 'time']

        for (const feature of features) {
            const accuracyScore = this.calculateAccuracyScore(feedback)
            const weightAdjustment = (accuracyScore - 50) / 1000 // Small adjustments

            await sql`
                INSERT INTO global_model_weights (
                    feature_name, weight_adjustment, accuracy_score, 
                    sample_count, created_at
                )
                VALUES (
                    ${feature}, ${weightAdjustment}, ${accuracyScore}, 
                    1, CURRENT_TIMESTAMP
                )
                ON CONFLICT (feature_name) 
                DO UPDATE SET 
                    weight_adjustment = (global_model_weights.weight_adjustment * global_model_weights.sample_count + ${weightAdjustment}) / (global_model_weights.sample_count + 1),
                    accuracy_score = (global_model_weights.accuracy_score * global_model_weights.sample_count + ${accuracyScore}) / (global_model_weights.sample_count + 1),
                    sample_count = global_model_weights.sample_count + 1,
                    updated_at = CURRENT_TIMESTAMP
            `
        }
    }

    /**
     * Get AI learning metrics for analytics
     */
    static async getLearningMetrics(
        timeframe: 'day' | 'week' | 'month' = 'week'
    ): Promise<LearningMetrics> {
        try {
            const sql = neon(`${process.env.DATABASE_URL}`)

            const timeCondition =
                timeframe === 'day'
                    ? "created_at >= NOW() - INTERVAL '1 day'"
                    : timeframe === 'week'
                      ? "created_at >= NOW() - INTERVAL '1 week'"
                      : "created_at >= NOW() - INTERVAL '1 month'"

            // Get accuracy metrics
            const accuracyData = await sql`
                SELECT 
                    AVG(CASE WHEN user_satisfaction IN ('satisfied', 'very_satisfied') THEN 1 ELSE 0 END) as satisfaction_rate,
                    AVG(CASE WHEN was_ai_recommended = true THEN 1 ELSE 0 END) as ai_usage_rate,
                    AVG(selected_from_position) as avg_position,
                    AVG(CASE WHEN price_acceptance IN ('fair', 'good_value') THEN 1 ELSE 0 END) as price_acceptance_rate,
                    AVG(CASE WHEN time_acceptance IN ('acceptable', 'very_fast') THEN 1 ELSE 0 END) as time_acceptance_rate
                FROM ride_feedback 
                WHERE ${timeCondition}
            `

            // Get most common context factors
            const contextData = await sql`
                SELECT 
                    context_factors,
                    COUNT(*) as frequency
                FROM ride_feedback 
                WHERE ${timeCondition} AND context_factors IS NOT NULL
                GROUP BY context_factors
                ORDER BY frequency DESC
                LIMIT 5
            `

            const metrics = accuracyData[0] || {}
            const contextFactors = contextData
                .map((row) => JSON.parse(row.context_factors || '[]'))
                .flat()
            const factorCounts = contextFactors.reduce(
                (acc, factor) => {
                    acc[factor] = (acc[factor] || 0) + 1
                    return acc
                },
                {} as Record<string, number>
            )

            const mostCommonReasons = Object.entries(factorCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([factor]) => factor)

            return {
                aiAccuracy: (metrics.satisfaction_rate || 0) * 100,
                userSatisfactionRate: (metrics.satisfaction_rate || 0) * 100,
                recommendationClickThroughRate:
                    (metrics.ai_usage_rate || 0) * 100,
                priceAcceptanceRate: (metrics.price_acceptance_rate || 0) * 100,
                timeAcceptanceRate: (metrics.time_acceptance_rate || 0) * 100,
                averageSelectedPosition: metrics.avg_position || 1,
                mostCommonReasons,
                improvementAreas: this.identifyImprovementAreas(metrics),
            }
        } catch (error) {
            console.error('Error getting learning metrics:', error)
            return {
                aiAccuracy: 0,
                userSatisfactionRate: 0,
                recommendationClickThroughRate: 0,
                priceAcceptanceRate: 0,
                timeAcceptanceRate: 0,
                averageSelectedPosition: 1,
                mostCommonReasons: [],
                improvementAreas: [],
            }
        }
    }

    /**
     * Identify areas for AI improvement
     */
    private static identifyImprovementAreas(metrics: any): string[] {
        const areas: string[] = []

        if (metrics.satisfaction_rate < 0.8) {
            areas.push('User satisfaction needs improvement')
        }
        if (metrics.avg_position > 2) {
            areas.push('Top recommendations not being selected')
        }
        if (metrics.price_acceptance_rate < 0.7) {
            areas.push('Price predictions need adjustment')
        }
        if (metrics.time_acceptance_rate < 0.8) {
            areas.push('Time estimates need refinement')
        }

        return areas
    }

    /**
     * Generate AI improvement suggestions
     */
    static async generateImprovementSuggestions(): Promise<string[]> {
        const metrics = await this.getLearningMetrics('week')
        const suggestions: string[] = []

        if (metrics.aiAccuracy < 75) {
            suggestions.push(
                'Consider adjusting weight distribution in recommendation algorithm'
            )
        }
        if (metrics.averageSelectedPosition > 2.5) {
            suggestions.push(
                'Improve ranking algorithm to surface better top choices'
            )
        }
        if (metrics.priceAcceptanceRate < 70) {
            suggestions.push(
                'Refine dynamic pricing model based on user feedback'
            )
        }
        if (metrics.userSatisfactionRate < 80) {
            suggestions.push(
                'Enhance personalization features and user preference learning'
            )
        }

        return suggestions
    }
}
