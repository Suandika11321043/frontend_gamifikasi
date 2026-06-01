import { useState, useEffect, useCallback } from 'react'

export function useFetch(url, options = {}) {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const token = localStorage.getItem('token')
            const isFormData = options.body instanceof FormData
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...options.headers,
                },
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.message || 'Terjadi kesalahan.')
            }

            setData(result)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [url])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    return { data, loading, error, refetch: fetchData }
}
