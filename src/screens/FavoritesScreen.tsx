/**
 * @screen FavoritesScreen
 * @description Screen displaying shows matching user's favorite genres and venues selected in Profile
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Heart, MapPin, Calendar, Lock, Music } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { useAppStateStore } from '../stores/appStateStore';
import { showService } from '../services/showService';
import { Show } from '../magically/entities/Show';
import { Skeleton } from '../components/ui/Skeleton';
import magically from 'magically-sdk';

export const FavoritesScreen = () => {
  const { background, text, textMuted, primary, cardBackground } = useTheme();
  const navigation = useNavigation<any>();
  const { favoriteGenres, favoriteVenues, selectedCity, isPremium } = useUserPreferences();
  const { isAuthenticated } = useAppStateStore();
  
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    loadFavoriteShows();
  }, [isAuthenticated, favoriteGenres, favoriteVenues, selectedCity]);

  const loadFavoriteShows = async () => {
    try {
      setIsLoading(true);
      
      // Only fetch if user has selected favorites
      if (favoriteGenres.length === 0 && favoriteVenues.length === 0) {
        setShows([]);
        return;
      }
      
      const data = await showService.getFavoriteShows(
        favoriteGenres,
        favoriteVenues,
        [], // No artist filtering for now
        selectedCity
      );
      setShows(data);
    } catch (error) {
      console.error('Error loading favorite shows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavoriteShows();
    setRefreshing(false);
  };

  const handleShowPress = (show: Show) => {
    navigation.navigate('ShowDetail', { showId: show._id });
  };

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  const handleGoToProfile = () => {
    navigation.navigate('Profile');
  };

  // Sign In Required
  if (!isAuthenticated) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: primary }}>
                <Lock size={36} color="#FFFFFF" strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: text, textAlign: 'center', marginBottom: 12 }}>
                Sign In Required
              </Text>
              <Text style={{ fontSize: 15, color: textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                Sign in to save your favorite genres and venues. Get personalized show recommendations!
              </Text>
              <Pressable onPress={handleLoginPress} style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}>
                <View style={{ paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', backgroundColor: primary }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                    Sign In
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const hasFavorites = favoriteGenres.length > 0 || favoriteVenues.length > 0;

  // Empty State - No favorites selected
  if (!isLoading && !hasFavorites) {
    return (
      <View style={{ flex: 1, backgroundColor: background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: primary + '20' }}>
                <Heart size={36} color={primary} strokeWidth={2.5} />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '900', color: text, textAlign: 'center', marginBottom: 12 }}>
                No Favorites Yet
              </Text>
              <Text style={{ fontSize: 15, color: textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22 }}>
                Go to Profile and select your favorite genres and venues to see personalized show recommendations here!
              </Text>
              <Pressable onPress={handleGoToProfile} style={{ borderRadius: 16, overflow: 'hidden', width: '100%' }}>
                <View style={{ paddingVertical: 16, paddingHorizontal: 32, alignItems: 'center', backgroundColor: primary }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                    Set Favorites
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: '900', color: text, marginBottom: 4 }}>
            Your Favorites
          </Text>
          <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
            Shows matching your favorite {favoriteGenres.length > 0 && 'genres'}{favoriteGenres.length > 0 && favoriteVenues.length > 0 && ' and '}{favoriteVenues.length > 0 && 'venues'}
          </Text>
        </View>

        {/* Shows List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primary} />}
        >
          {isLoading ? (
            <>
              <Skeleton width="100%" height={140} style={{ marginBottom: 16, borderRadius: 20 }} />
              <Skeleton width="100%" height={140} style={{ marginBottom: 16, borderRadius: 20 }} />
              <Skeleton width="100%" height={140} style={{ marginBottom: 16, borderRadius: 20 }} />
            </>
          ) : shows.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Music size={48} color={textMuted} strokeWidth={1.5} style={{ marginBottom: 16 }} />
              <Text style={{ fontSize: 18, fontWeight: '800', color: text, textAlign: 'center', marginBottom: 8 }}>
                No Matching Shows
              </Text>
              <Text style={{ fontSize: 14, color: textMuted, textAlign: 'center', lineHeight: 20 }}>
                There are no upcoming shows in {selectedCity} matching your favorite genres or venues. Check back later!
              </Text>
            </View>
          ) : (
            shows.map((show) => (
              <Pressable key={show._id} onPress={() => handleShowPress(show)}>
                <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 16, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: text, marginBottom: 8 }}>
                    {show.artist}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <MapPin size={14} color={textMuted} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
                      {show.venue}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <Calendar size={14} color={textMuted} style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 14, color: textMuted, fontWeight: '600' }}>
                      {new Date(show.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {show.time}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {show.genre.slice(0, 3).map((genre) => (
                      <View key={genre} style={{ paddingVertical: 4, paddingHorizontal: 10, backgroundColor: primary + '20', borderRadius: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '700', color: primary }}>
                          {genre}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};
