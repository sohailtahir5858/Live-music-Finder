/**
 * @screen ShowsScreen
 * @description Home screen displaying all live music shows with city toggle and filtering
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Easing, RefreshControl, FlatList, ActivityIndicator } from 'react-native';
import { Music2, MapPin, Calendar, Heart, Sliders, Search, Grid3x3, List } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { useFilterStore } from '../stores/filterStore';
import { Show, Shows } from '../magically/entities/Show';
import { Skeleton } from '../components/ui/Skeleton';
import magically from 'magically-sdk';
import { ShowListItem } from '../components/ShowListItem';
import { Image } from 'expo-image';
import { fetchEvents } from '../services/eventService';

export const ShowsScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground } = useTheme();
  const navigation = useNavigation<any>();
  const { selectedCity, setSelectedCity, favoriteArtists, toggleFavoriteArtist, isPremium, viewMode, setViewMode, hasLoadedPreferences } = useUserPreferences();
  const { activeFilters, hasActiveFilters } = useFilterStore();
  
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoadingShows, setIsLoadingShows] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
    
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Only load shows after preferences (e.g., selected city) have been loaded to avoid duplicate fetches
    if (hasLoadedPreferences) {
      loadShows();
    }
  }, [selectedCity, activeFilters, hasLoadedPreferences]);

  const loadShows = async (page = 1) => {
    try {
      if (page === 1) {
        setIsLoadingShows(true);
        setShows([]);
        setCurrentPage(1);
        setHasMore(true);
      }
      
      // Build filter options from activeFilters
      const filterOptions = {
        categoryIds: activeFilters.genres && activeFilters.genres.length > 0 
          ? activeFilters.genres 
          : undefined,
        timeFilter: activeFilters.timeFilter,
        dateFrom: activeFilters.dateFrom,
        dateTo: activeFilters.dateTo,
      };
      
      const result = await fetchEvents(selectedCity, page, filterOptions);
      if (page === 1) {
        setShows(result);
      } else {
        setShows(prev => [...prev, ...result]);
      }
      setCurrentPage(page);
      setHasMore(result.length > 0);
    } catch (error) {
      console.error('Error loading shows:', error);
    } finally {
      setIsLoadingShows(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      loadShows(currentPage + 1);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadShows(1);
    setIsRefreshing(false);
  };

  const handleShowPress = (show: Show) => {
    navigation.navigate('ShowDetail', { show });
  };

  const handleFilterPress = () => {
    navigation.navigate('Filter');
  };

  const handleFavoritePress = (artist: string) => {
    if (!magically.auth.currentUser) {
      navigation.navigate('Login');
      return;
    }
    toggleFavoriteArtist(artist);
  };

  const isFavorite = (artist: string) => favoriteArtists.includes(artist);

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flex: 1, backgroundColor: background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 24, marginTop: 16, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View
                    style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2a41e' }}
                  >
                    <Music2 size={24} color="#FFFFFF" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 28, fontWeight: '900', color: text, letterSpacing: -0.5 }}>
                      Live Shows
                    </Text>
                    <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600', marginTop: 2 }}>
                      {shows.length} upcoming events
                    </Text>
                  </View>
                </View>
                
                {/* View Mode Toggle + Filter */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => setViewMode(viewMode === 'card' ? 'list' : 'card')}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: cardBackground,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {viewMode === 'card' ? (
                      <List size={20} color={primary} strokeWidth={2.5} />
                    ) : (
                      <Grid3x3 size={20} color={primary} strokeWidth={2.5} />
                    )}
                  </Pressable>
                  <Pressable
                    onPress={handleFilterPress}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: hasActiveFilters() ? primary : cardBackground,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sliders size={20} color={hasActiveFilters() ? '#FFFFFF' : primary} strokeWidth={2.5} />
                    {hasActiveFilters() && (
                      <View style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#f2a41e' }} />
                    )}
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Shows List */}
            {isLoadingShows ? (
              <View style={{ paddingHorizontal: 24 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} width="100%" height={viewMode === 'card' ? 280 : 80} style={{ marginBottom: viewMode === 'card' ? 24 : 12, borderRadius: viewMode === 'card' ? 24 : 16 }} />
                ))}
              </View>
            ) : shows.length === 0 ? (
              <View style={{ padding: 32, alignItems: 'center' }}>
                <Text style={{ color: textMuted, fontSize: 16, textAlign: 'center' }}>
                  No shows available
                </Text>
              </View>
            ) : (
              <FlatList
                data={shows}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                  <React.Fragment key={item._id}>
                    {viewMode === 'card' ? (
                      <ShowCard
                        show={item}
                        onPress={() => handleShowPress(item)}
                        onFavoritePress={() => handleFavoritePress(item.artist)}
                        isFavorite={isFavorite(item.artist)}
                        isPremium={isPremium}
                        index={index}
                        primary={primary}
                        secondary={secondary}
                        cardBackground={cardBackground}
                        text={text}
                        textMuted={textMuted}
                      />
                    ) : (
                      <ShowListItem
                        show={item}
                        onPress={() => handleShowPress(item)}
                        onFavoritePress={() => handleFavoritePress(item.artist)}
                        isFavorite={isFavorite(item.artist)}
                        isPremium={isPremium}
                      />
                    )}
                  </React.Fragment>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                refreshControl={
                  <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={primary} />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                ListFooterComponent={isLoadingMore ? <ActivityIndicator size="large" color={primary} style={{ marginVertical: 20 }} /> : null}
              />
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </View>
  );
};

interface ShowCardProps {
  show: Show;
  onPress: () => void;
  onFavoritePress: () => void;
  isFavorite: boolean;
  isPremium: boolean;
  index: number;
  primary: string;
  secondary: string;
  cardBackground: string;
  text: string;
  textMuted: string;
}

const ShowCard = ({ show, onPress, onFavoritePress, isFavorite, isPremium, index, primary, secondary, cardBackground, text, textMuted }: ShowCardProps) => {
  const cardScale = React.useRef(new Animated.Value(1)).current;
  const heartScale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(cardScale, { toValue: 0.97, useNativeDriver: true, friction: 7 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, friction: 7 }).start();
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, { toValue: 1.4, duration: 120, easing: Easing.bezier(0.4, 0, 0.2, 1), useNativeDriver: true }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
    ]).start();
    onFavoritePress();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Animated.View style={{ marginBottom: 24, transform: [{ scale: cardScale }] }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: cardBackground }}>
          {/* Show Image */}
          <View style={{ height: 200, position: 'relative' }}>
            <Image
              source={show.imageUrl || `https://trymagically.com/api/media/image?query=${encodeURIComponent(show.artist + ' live music')}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            {/* Favorite Button */}
            <Pressable
              onPress={handleFavorite}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: '#0A0A0AE6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                <Heart size={20} color={isFavorite ? '#EF4444' : '#FFFFFF'} fill={isFavorite ? '#EF4444' : 'transparent'} strokeWidth={2.5} />
              </Animated.View>
            </Pressable>

            {/* Event Categories */}
            <View style={{ position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 }}>
              {show.genre.slice(0, 2).map((genre, i) => (
                <View key={i} style={{ borderRadius: 12, overflow: 'hidden' }}>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f2a41e' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {genre}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Show Info */}
          <View style={{ padding: 18 }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: text, marginBottom: 8 }}>
              {show.artist}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <MapPin size={16} color={primary} strokeWidth={2.5} />
              <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
                {show.venue}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Calendar size={16} color={secondary} strokeWidth={2.5} />
              <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
                {formatDate(show.date)} • {show.time}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};