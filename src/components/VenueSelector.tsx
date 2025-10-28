/**
 * @component VenueSelector
 * @description Multi-select venue chips for user preferences
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../stores/userPreferencesStore';
import magically from 'magically-sdk';

export const VenueSelector = () => {
  const { text, textMuted, primary, cardBackground, border } = useTheme();
  const { favoriteVenues, toggleFavoriteVenue, isPremium, selectedCity } = useUserPreferences();
  const [venues, setVenues] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadVenues();
  }, [selectedCity]);

  const loadVenues = async () => {
    try {
      setIsLoading(true);
      // Get unique venues from shows for selected city
      const result = await magically.data.aggregate('shows', [
        { $match: { city: selectedCity } },
        { $group: { _id: '$venue' } },
        { $sort: { _id: 1 } }
      ]);
      
      const uniqueVenues = result
        .map((item: any) => item._id)
        .filter((v: string) => v && v !== 'TBA'); // Filter out TBA venues
      
      setVenues(uniqueVenues);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVenuePress = (venue: string) => {
    const isAlreadySelected = favoriteVenues.includes(venue);
    const canSelect = isPremium || isAlreadySelected || favoriteVenues.length < 2;
    
    if (!canSelect) {
      // User has reached limit - don't toggle
      return;
    }
    
    toggleFavoriteVenue(venue);
  };

  if (isLoading) {
    return (
      <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <MapPin size={20} color={primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: text }}>
            Favorite Venues
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600' }}>
          Loading venues...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: cardBackground, borderRadius: 20, padding: 20, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={20} color={primary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: text }}>
            Favorite Venues in {selectedCity}
          </Text>
        </View>
        {!isPremium && (
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: border, borderRadius: 6 }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: textMuted, letterSpacing: 0.5 }}>
              {favoriteVenues.length}/2
            </Text>
          </View>
        )}
      </View>
      
      <Text style={{ fontSize: 13, color: textMuted, fontWeight: '600', marginBottom: 16, lineHeight: 18 }}>
        {isPremium 
          ? 'Select your favorite venues to see matching shows in Favorites tab' 
          : 'Select up to 2 favorite venues (upgrade for unlimited)'}
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {venues.map((venue) => {
          const isSelected = favoriteVenues.includes(venue);
          const canSelect = isPremium || isSelected || favoriteVenues.length < 2;
          
          return (
            <Pressable
              key={venue}
              onPress={() => handleVenuePress(venue)}
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
                color: isSelected ? primary : text,
                whiteSpace: 'nowrap',
              }}>
                {venue}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
