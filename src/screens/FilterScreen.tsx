/**
 * @screen FilterScreen
 * @description Advanced filtering screen for shows with multi-select filters
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { ArrowLeft, Sliders, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { showService } from '../services/showService';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { useFilterStore } from '../stores/filterStore';

export const FilterScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground, border } = useTheme();
  const navigation = useNavigation();
  const { selectedCity } = useUserPreferences();
  const { activeFilters, setFilters, clearFilters: clearStoreFilters } = useFilterStore();
  
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableVenues, setAvailableVenues] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(activeFilters.genres);
  const [selectedVenues, setSelectedVenues] = useState<string[]>(activeFilters.venues);
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>(activeFilters.datePreset);

  const datePresets = showService.getDatePresets();

  useEffect(() => {
    loadFilterOptions();
  }, [selectedCity]);

  const loadFilterOptions = async () => {
    const genres = await showService.getGenres();
    const venues = await showService.getVenues(selectedCity);
    setAvailableGenres(genres);
    setAvailableVenues(venues);
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleVenue = (venue: string) => {
    setSelectedVenues(prev =>
      prev.includes(venue) ? prev.filter(v => v !== venue) : [...prev, venue]
    );
  };

  const handleApplyFilters = () => {
    // Get date range from preset if selected
    let dateFrom, dateTo;
    if (selectedDatePreset) {
      const preset = datePresets[selectedDatePreset];
      if (preset) {
        dateFrom = preset.dateFrom;
        dateTo = preset.dateTo;
      }
    }

    // Save filters to store
    setFilters({
      genres: selectedGenres,
      venues: selectedVenues,
      datePreset: selectedDatePreset,
      dateFrom,
      dateTo,
    });

    // Navigate back to Shows screen
    navigation.goBack();
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSelectedVenues([]);
    setSelectedDatePreset('');
    clearStoreFilters();
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedVenues.length > 0 || selectedDatePreset;

  return (
    <View style={{ flex: 1, backgroundColor: background }}>
      <View style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          {/* Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <Pressable
                onPress={() => navigation.goBack()}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: cardBackground, alignItems: 'center', justifyContent: 'center' }}
              >
                <ArrowLeft size={20} color={text} strokeWidth={2.5} />
              </Pressable>
              <Text style={{ fontSize: 24, fontWeight: '900', color: text, letterSpacing: -0.5 }}>
                Filters
              </Text>
            </View>
            {hasActiveFilters && (
              <Pressable onPress={handleClearFilters}>
                <Text style={{ fontSize: 14, color: primary, fontWeight: '700' }}>
                  Clear All
                </Text>
              </Pressable>
            )}
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}>
            {/* Date Presets */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: text, marginBottom: 12 }}>
                When
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {Object.entries(datePresets).map(([key, preset]) => {
                  const isSelected = selectedDatePreset === key;
                  return (
                    <Pressable
                      key={key}
                      onPress={() => setSelectedDatePreset(isSelected ? '' : key)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        borderRadius: 14,
                        backgroundColor: isSelected ? 'transparent' : cardBackground,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: primary,
                        overflow: 'hidden',
                      }}
                    >
                      {isSelected && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: primary, opacity: 0.1 }} />
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#FFFFFF' : text }}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Genres */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: text }}>
                  Genres
                </Text>
                {selectedGenres.length > 0 && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: primary + '20', borderRadius: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: primary }}>
                      {selectedGenres.length} selected
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {availableGenres.map((genre) => {
                  const isSelected = selectedGenres.includes(genre);
                  return (
                    <Pressable
                      key={genre}
                      onPress={() => toggleGenre(genre)}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 18,
                        borderRadius: 14,
                        backgroundColor: isSelected ? 'transparent' : cardBackground,
                        borderWidth: isSelected ? 2 : 0,
                        borderColor: primary,
                        overflow: 'hidden',
                      }}
                    >
                      {isSelected && (
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: primary, opacity: 0.1 }} />
                      )}
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? '#FFFFFF' : text }}>
                        {genre}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Venues */}
            <View style={{ marginBottom: 32 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: text }}>
                  Venues in {selectedCity}
                </Text>
                {selectedVenues.length > 0 && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: primary + '20', borderRadius: 10 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: primary }}>
                      {selectedVenues.length} selected
                    </Text>
                  </View>
                )}
              </View>
              {availableVenues.map((venue) => {
                const isSelected = selectedVenues.includes(venue);
                return (
                  <Pressable
                    key={venue}
                    onPress={() => toggleVenue(venue)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 14,
                      backgroundColor: isSelected ? primary + '20' : cardBackground,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? primary : border,
                      marginBottom: 10,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: isSelected ? primary : text, flex: 1 }}>
                        {venue}
                      </Text>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: isSelected ? primary : border,
                          backgroundColor: isSelected ? primary : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected && (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' }} />
                        )}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingVertical: 20, backgroundColor: background, borderTopWidth: 1, borderTopColor: border }}>
            <SafeAreaView edges={['bottom']}>
              <Pressable onPress={handleApplyFilters} style={{ borderRadius: 16, overflow: 'hidden' }}>
                <View style={{ paddingVertical: 16, alignItems: 'center', backgroundColor: '#f2a41e' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                    {hasActiveFilters ? `Apply Filters` : 'Show All Shows'}
                  </Text>
                </View>
              </Pressable>
            </SafeAreaView>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};