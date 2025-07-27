import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStoragesByKeeper } from '@/lib/query/hooks';
import { useStorageRatings } from '@/lib/query/hooks/useRatingQueries';
import { useKeeperIdByUserId } from '@/lib/query/hooks/useUserQueries';
import { Rating } from '@/lib/types/rating.types';
import { useUserStore } from '@/store';

const RATING_COLORS = {
  5: '#10B981', // Green
  4: '#84CC16', // Light Green  
  3: '#F59E0B', // Orange
  2: '#EF4444', // Red
  1: '#DC2626', // Dark Red
} as const;

const ReviewManagement: React.FC = () => {
  const router = useRouter();
  const { user } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStorageId, setSelectedStorageId] = useState<string | null>(null);
  
  // Get keeper ID for the user
  const { 
    data: keeperId, 
    isLoading: isLoadingKeeperId, 
    error: keeperIdError 
  } = useKeeperIdByUserId(user?.id || '', {
    enabled: !!user?.id && user?.role === 'KEEPER'
  });

  // Get keeper's storages
  const {
    data: storagesResponse,
    isLoading: isLoadingStorages,
    refetch: refetchStorages,
  } = useStoragesByKeeper(keeperId || '', {
    enabled: !!keeperId,
  });

  // Safely extract storages data
  const storagesData = (storagesResponse as any)?.data;
  const storages = storagesData?.data || [];

  // Get ratings for selected storage
  const {
    data: ratingsResponse,
    isLoading: isLoadingRatings,
    refetch: refetchRatings,
  } = useStorageRatings(selectedStorageId || '', {
    pageSize: 50,
  }, {
    enabled: !!selectedStorageId,
  });

  // Safely extract ratings data with useMemo
  const ratings = useMemo(() => {
    return (ratingsResponse as any) || [];
  }, [ratingsResponse]);

  // Calculate statistics for selected storage
  const ratingStats = useMemo(() => {
    if (!ratings.length) {
      return {
        averageRating: 0,
        totalRatings: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalStars = 0;

    ratings.forEach((rating: Rating) => {
      totalStars += rating.star;
      distribution[rating.star as keyof typeof distribution]++;
    });

    return {
      averageRating: Math.round((totalStars / ratings.length) * 10) / 10,
      totalRatings: ratings.length,
      distribution,
    };
  }, [ratings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStorages(),
      selectedStorageId ? refetchRatings() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  const handleStorageSelect = (storageId: string) => {
    setSelectedStorageId(storageId);
  };

  const renderStarRating = (star: number, size: number = 16) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((i) => (
          <Ionicons
            key={i}
            name={i <= star ? 'star' : 'star-outline'}
            size={size}
            color={i <= star ? '#F59E0B' : '#D1D5DB'}
          />
        ))}
      </View>
    );
  };

  const renderStorageSelector = () => (
    <View className="bg-white mx-4 mb-4 rounded-xl shadow-sm border border-gray-100 p-4">
      <View className="flex-row items-center mb-3">
        <View className="bg-blue-100 rounded-full p-2 mr-3">
          <Ionicons name="storefront-outline" size={18} color="#3B82F6" />
        </View>
        <Text className="text-lg font-bold text-gray-900">Select Storage</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row">
          {storages.map((storage: any) => (
            <TouchableOpacity
              key={storage.id}
              onPress={() => handleStorageSelect(storage.id)}
              className={`mr-3 px-4 py-2.5 rounded-full border-2 ${
                selectedStorageId === storage.id
                  ? 'bg-blue-500 border-blue-500 shadow-lg'
                  : 'bg-white border-gray-200 shadow-sm'
              }`}
              style={{
                elevation: selectedStorageId === storage.id ? 4 : 1,
              }}
            >
              <Text
                className={`font-bold text-sm ${
                  selectedStorageId === storage.id ? 'text-white' : 'text-gray-700'
                }`}
                numberOfLines={1}
              >
                {storage.name || `Storage ${storage.id.slice(0, 8)}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderRatingStats = () => (
    <View className="bg-white mx-4 mb-4 rounded-xl shadow-sm border border-gray-100 p-4">
      <View className="flex-row items-center mb-4">
        <View className="bg-yellow-100 rounded-full p-2 mr-3">
          <Ionicons name="analytics-outline" size={18} color="#F59E0B" />
        </View>
        <Text className="text-lg font-bold text-gray-900">Rating Overview</Text>
      </View>

      <View className="flex-row justify-between items-center mb-4">
        <View className="items-center">
          <Text className="text-3xl font-bold text-gray-900">{ratingStats.averageRating}</Text>
          <View className="flex-row mt-1">
            {renderStarRating(Math.round(ratingStats.averageRating), 14)}
          </View>
          <Text className="text-gray-500 text-sm mt-1">Average Rating</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-blue-600">{ratingStats.totalRatings}</Text>
          <Text className="text-gray-500 text-sm">Total Reviews</Text>
        </View>
      </View>

      {/* Rating Distribution */}
      <View>
        <Text className="font-semibold text-gray-700 mb-3">Rating Distribution</Text>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingStats.distribution[star as keyof typeof ratingStats.distribution];
          const percentage = ratingStats.totalRatings > 0 ? (count / ratingStats.totalRatings) * 100 : 0;
          
          return (
            <View key={star} className="flex-row items-center mb-2">
              <Text className="text-sm font-medium text-gray-600 w-6">{star}</Text>
              <Ionicons name="star" size={12} color="#F59E0B" style={{ marginRight: 8 }} />
              <View className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                <View
                  className="h-2 rounded-full"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: RATING_COLORS[star as keyof typeof RATING_COLORS],
                  }}
                />
              </View>
              <Text className="text-sm font-medium text-gray-600 w-8">{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderRatingItem = ({ item }: { item: Rating }) => (
    <View className="bg-white mx-4 my-2 rounded-xl shadow-sm border border-gray-100 p-4">
      {/* Header with rating and date */}
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <View className="bg-gray-100 rounded-full p-2 mr-3">
              <Ionicons name="person-outline" size={16} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">{item.renterName || 'Anonymous User'}</Text>
              <Text className="text-sm text-gray-500">
                {new Date(item.ratingDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
          </View>
        </View>
        <View className="items-end">
          {renderStarRating(item.star, 16)}
          <View 
            className="px-2 py-1 rounded-full mt-1"
            style={{ backgroundColor: `${RATING_COLORS[item.star as keyof typeof RATING_COLORS]}20` }}
          >
            <Text 
              className="text-xs font-bold"
              style={{ color: RATING_COLORS[item.star as keyof typeof RATING_COLORS] }}
            >
              {item.star}/5
            </Text>
          </View>
        </View>
      </View>

      {/* Comment */}
      {item.comment && (
        <View className="bg-gray-50 rounded-lg p-3">
          <Text className="text-gray-700 leading-relaxed">{item.comment}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyRatings = () => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <View className="bg-gray-100 rounded-full p-8 mb-6">
        <Ionicons name="star-outline" size={64} color="#9CA3AF" />
      </View>
      <Text className="text-gray-900 text-xl font-bold mb-2 text-center">No Reviews Yet</Text>
      <Text className="text-gray-500 text-center text-base leading-relaxed">
        {selectedStorageId 
          ? "This storage hasn't received any reviews yet. Reviews will appear here once customers rate your storage."
          : "Select a storage to view its reviews and ratings."
        }
      </Text>
    </View>
  );

  // Loading states
  if (keeperIdError) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Review Management</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-red-100 rounded-full p-8 mb-6">
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text className="text-red-600 text-xl font-bold mb-2 text-center">
            Error Loading User Info
          </Text>
          <Text className="text-gray-600 text-center mb-6 text-base leading-relaxed">
            {keeperIdError.message || 'Failed to load user information. Please try again.'}
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white font-bold text-base">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoadingKeeperId || isLoadingStorages) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">Review Management</Text>
              <Text className="text-sm text-gray-500 mt-1">Manage your storage reviews</Text>
            </View>
            <View className="bg-yellow-100 rounded-full p-3">
              <Ionicons name="star-outline" size={24} color="#F59E0B" />
            </View>
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <View className="bg-blue-100 rounded-full p-8 mb-6">
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
          <Text className="text-gray-600 text-lg font-medium">Loading your storages...</Text>
          <Text className="text-gray-500 text-center mt-2">Please wait while we fetch your storage information</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (user?.role !== 'KEEPER' || !keeperId || storages.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View 
          className="bg-white px-4 py-6 border-b border-gray-200"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.back()}
              className="mr-4 bg-gray-100 rounded-full p-2"
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900">Review Management</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-8">
          <View className="bg-orange-100 rounded-full p-8 mb-6">
            <Ionicons name="storefront-outline" size={64} color="#F59E0B" />
          </View>
          <Text className="text-gray-900 text-xl font-bold mb-2 text-center">
            {user?.role !== 'KEEPER' ? 'Access Restricted' : 'No Storages Found'}
          </Text>
          <Text className="text-gray-500 text-center text-base leading-relaxed mb-6">
            {user?.role !== 'KEEPER' 
              ? 'This feature is only available for keepers. Please register as a keeper to manage reviews.'
              : 'You need to create at least one storage to view reviews. Create your first storage to get started.'
            }
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-blue-500 px-8 py-4 rounded-full shadow-lg"
          >
            <Text className="text-white font-bold text-base">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View 
        className="bg-white px-4 py-6 border-b border-gray-200"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4 bg-gray-100 rounded-full p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">Review Management</Text>
            <Text className="text-sm text-gray-500 mt-1">Manage your storage reviews</Text>
          </View>
          <View className="bg-yellow-100 rounded-full p-3">
            <Ionicons name="star-outline" size={24} color="#F59E0B" />
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Storage Selector */}
        {renderStorageSelector()}

        {/* Rating Statistics */}
        {selectedStorageId && renderRatingStats()}

        {/* Reviews List */}
        {selectedStorageId && (
          <View className="pb-6">
            {isLoadingRatings ? (
              <View className="py-20 items-center">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-600 mt-4">Loading reviews...</Text>
              </View>
            ) : ratings.length > 0 ? (
              <FlatList
                data={ratings}
                keyExtractor={(item) => item.id}
                renderItem={renderRatingItem}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              renderEmptyRatings()
            )}
          </View>
        )}

        {!selectedStorageId && renderEmptyRatings()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewManagement;
