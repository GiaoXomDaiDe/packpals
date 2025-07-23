import Map from '@/components/Map'
import { useStorageStore } from '@/store'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'

const palette = {
    background: '#fafafa',
    surface: '#ffffff',
    primary: '#2563eb',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
}

const StorageList = () => {
    const { storages, setStorages, setSelectedStorage } = useStorageStore()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchStorages()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const fetchStorages = async () => {
        setLoading(true)
        setError('')
        try {
          const res = await fetch('http://localhost:5000/api/storage/all')
          console.log(res, 'Response from storage API')
            const data = await res.json()
          // For paged response: data.data.data is the array
          console.log(data.data, 'Data from storage API')
            const storagesArray = Array.isArray(data.data) ? data.data : []
            setStorages(storagesArray)
        } catch {
            setError('Failed to load storages')
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (storage: any) => {
        setSelectedStorage(storage.id)
        router.push(`/storage-detail/${storage.id}`)
    }

    return (
        <View style={{ flex: 1, backgroundColor: palette.background }}>
            <View style={{ height: 220 }}>
                <Map />
            </View>
            <View style={{ flex: 1, padding: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', color: palette.text, marginBottom: 12 }}>Available Storages</Text>
                {loading ? (
                    <ActivityIndicator size="large" color={palette.primary} />
                ) : error ? (
                    <Text style={{ color: 'red' }}>{error}</Text>
                ) : (
                    <FlatList
                        data={storages}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => handleSelect(item)}
                                style={{ backgroundColor: palette.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: palette.border, flexDirection: 'row', alignItems: 'center' }}
                            >
                                <Ionicons name="cube-outline" size={28} color={palette.primary} style={{ marginRight: 16 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: palette.text }}>{item.title}</Text>
                                    <Text style={{ fontSize: 13, color: palette.textSecondary }}>{item.address}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
    )
}

export default StorageList
