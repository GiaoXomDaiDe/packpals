import { useCallback, useEffect, useState } from 'react'

export const fetchAPI = async (url: string, options?: RequestInit) => {
    try {
        const response = await fetch(url, options)
        const data = await response.json()
        
        if (!response.ok) {
            // Return a standardized error response
            return {
                success: false,
                message: data.message || `HTTP error! status: ${response.status}`,
                statusCode: response.status,
                data: null
            }
        }
        
        // Return a standardized success response
        return {
            success: true,
            message: data.message || 'Success',
            statusCode: response.status,
            data: data
        }
    } catch (error) {
        console.error('Fetch error:', error)
        // Return a standardized error response for network/parsing errors
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error occurred',
            statusCode: 0,
            data: null
        }
    }
}

export const useFetch = <T>(url: string, options?: RequestInit) => {
    const [data, setData] = useState<T | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const result = await fetchAPI(url, options)
            setData(result.data)
        } catch (err) {
            setError((err as Error).message)
        } finally {
            setLoading(false)
        }
    }, [url, options])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}
