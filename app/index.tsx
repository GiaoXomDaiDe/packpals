import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import 'react-native-get-random-values'

import { authAPI } from '@/lib/api'
import { useUserStore } from '@/store'

const Page = () => {
    const { setUser } = useUserStore()
    const [isLoading, setIsLoading] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                const isAuth = await authAPI.isAuthenticated()
                if (isAuth) {
                    const user = await authAPI.getUser()
                    const token = await authAPI.getToken()
                    if (user && token) {
                        setUser(user, token)
                        setIsAuthenticated(true)
                    }
                }
            } catch (error) {
                console.error('Auth check failed:', error)
            } finally {
                setIsLoading(false)
            }
        }

        checkAuthStatus()
    }, [setUser])

    if (isLoading) {
        return null // Or a loading spinner component
    }

    if (isAuthenticated) {
        return <Redirect href="/(root)/(tabs)/home" />
    }

    return <Redirect href="/(auth)/welcome" />
}

export default Page
