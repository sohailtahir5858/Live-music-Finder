/**
 * @component GenreSelector
 * @description Multi-select genre chips for user preferences
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Music } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import magically from 'magically-sdk';

export const GenreSelector = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const { favoriteGenres, toggleFavoriteGenre, isPremium } = useUserPreferences();
  const [genres, setGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      // Get unique genres from shows using aggregation
      const result = await magically.data.aggregate('shows', [
        { $unwind: '$genre' },
        { $group: { _id: '$genre' } },
        { $sort: { _id: 1 } }
      ]);
      
      const uniqueGenres = result
        .map((item: any) => item._id)
        .filter((g: string) => g && !g.startsWith('http')); // Filter out URLs
      
      setGenres(uniqueGenres);
    } catch (error) {
      console.error('Error loading genres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenrePress = (genre: string) => {
    const isAlreadySelected = favoriteGenres.includes(genre);
    const canSelect = isPremium || isAlreadySelected || favoriteGenres.length < 2;
    
    if (!canSelect) {
      // User has reached limit - don't toggle
      return;
    }
    
    toggleFavoriteGenre(genre);
  };

  if (isLoading) {
    return (
      <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Music size={20} color={primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: text }}>
            Favorite Genres
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600' }}>
          Loading genres...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Music size={20} color={primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: text }}>
            Favorite Genres
          </Text>
        </View>
        {!isPremium && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: border, borderRadius: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: textMuted, letterSpacing: 0.5 }}>
              {favoriteGenres.length}/2
            </Text>
          </View>
        )}
      </View>
      
      <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600', marginBottom: 16, lineHeight: 18 }}>
        {isPremium 
          ? 'Select your favorite genres to see matching shows in Favorites tab' 
          : 'Select up to 2 favorite genres (upgrade for unlimited)'}
      </Text>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {genres.map((genre) => {
          const isSelected = favoriteGenres.includes(genre);
          const canSelect = isPremium || isSelected || favoriteGenres.length < 2;
          
          return (
            <Pressable
              key={genre}
              onPress={() => handleGenrePress(genre)}
              disabled={!canSelect && !isSelected}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 16,
                borderRadius: 20,
                borderWidth: 2,
                borderColor: isSelected ? primary : border,
                backgroundColor: isSelected ? primary + '20' : 'transparent',
                opacity: (!canSelect && !isSelected) ? 0.4 : 1,
              }}
            >
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '700', 
                color: isSelected ? primary : text 
              }}>
                {genre}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};
