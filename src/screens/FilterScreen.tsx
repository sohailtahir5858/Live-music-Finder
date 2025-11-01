/**
 * @screen FilterScreen
 * @description Advanced filtering screen for shows with multi-select filters
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal } from 'react-native';
import { ArrowLeft, Sliders, X, Calendar } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { showService } from '../services/showService';
import { useUserPreferences } from '../stores/userPreferencesStore';
import { useFilterStore } from '../stores/filterStore';
import { fetchGenres, fetchVenues, WordPressCategory, WordPressVenue, decodeHtmlEntities } from '../services/eventService';
import { TIME_FILTERS, getDatePresets, getTimeFilterStrings } from '../utils/filterHelpers';
import { CustomDateRangePicker } from '../components/CustomDateRangePicker';

export const FilterScreen = () => {
  const { background, text, textMuted, primary, secondary, cardBackground, border } = useTheme();
  const navigation = useNavigation();
  const { selectedCity } = useUserPreferences();
  const { activeFilters, setFilters, clearFilters: clearStoreFilters } = useFilterStore();
  
  const [availableGenres, setAvailableGenres] = useState<WordPressCategory[]>([]);
  const [availableVenues, setAvailableVenues] = useState<WordPressVenue[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string | null>(null);
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('');
  const [customDateFrom, setCustomDateFrom] = useState<Date | null>(null);
  const [customDateTo, setCustomDateTo] = useState<Date | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const datePresets = getDatePresets();

  useEffect(() => {
    loadFilterOptions();
    // Load previous filter values from store
    if (activeFilters) {
      if (activeFilters.genres && activeFilters.genres.length > 0) {
        setSelectedGenres(activeFilters.genres);
      }
      if (activeFilters.venues && activeFilters.venues.length > 0) {
        setSelectedVenues(activeFilters.venues);
      }
      if (activeFilters.timeFilter) {
        setSelectedTimeFilter(activeFilters.timeFilter);
      }
      if (activeFilters.datePreset) {
        setSelectedDatePreset(activeFilters.datePreset);
      }
      if (activeFilters.dateFrom) {
        setCustomDateFrom(new Date(activeFilters.dateFrom));
      }
      if (activeFilters.dateTo) {
        setCustomDateTo(new Date(activeFilters.dateTo));
      }
    }
  }, [selectedCity]);

  const loadFilterOptions = async () => {
    try {
      const genres = await fetchGenres(selectedCity);
      const venues = await fetchVenues(selectedCity);
      setAvailableGenres(genres);
      setAvailableVenues(venues);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const toggleGenre = (genreName: string) => {
    setSelectedGenres(prev =>
      prev.includes(genreName) ? prev.filter(g => g !== genreName) : [...prev, genreName]
    );
  };

  const toggleVenue = (venueName: string) => {
    setSelectedVenues(prev =>
      prev.includes(venueName) ? prev.filter(v => v !== venueName) : [...prev, venueName]
    );
  };

  const handleApplyFilters = () => {
    // Get date range from preset if selected
    let dateFrom: string | undefined = undefined;
    let dateTo: string | undefined = undefined;
    
    if (selectedDatePreset && selectedDatePreset !== 'custom') {
      const preset = datePresets.find(p => p.value === selectedDatePreset);
      if (preset) {
        const range = preset.getDateRange();
        dateFrom = range.from;
        dateTo = range.to;
      }
    } else if (selectedDatePreset === 'custom' && customDateFrom && customDateTo) {
      dateFrom = customDateFrom.toISOString().split('T')[0];
      dateTo = customDateTo.toISOString().split('T')[0];
    }

    // Save filters to store
    setFilters({
      genres: selectedGenres,
      venues: selectedVenues,
      timeFilter: selectedTimeFilter || undefined,
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
    setSelectedTimeFilter(null);
    setSelectedDatePreset('');
    setCustomDateFrom(null);
    setCustomDateTo(null);
    clearStoreFilters();
  };

  const hasActiveFilters = selectedGenres.length > 0 || selectedVenues.length > 0 || selectedTimeFilter || selectedDatePreset;

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
            {/* Time Filter */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: text, marginBottom: 12 }}>
                Time of Day
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {TIME_FILTERS.map((timeFilter) => {
                  const isSelected = selectedTimeFilter === timeFilter.value;
                  return (
                    <Pressable
                      key={timeFilter.value}
                      onPress={() => setSelectedTimeFilter(isSelected ? '' : timeFilter.value)}
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
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? primary : text }}>
                        {timeFilter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Date Presets */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontSize: 16, fontWeight: '800', color: text, marginBottom: 12 }}>
                Date Range
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {datePresets.map((preset) => {
                  const isSelected = selectedDatePreset === preset.value;
                  return (
                    <Pressable
                      key={preset.value}
                      onPress={() => setSelectedDatePreset(isSelected ? '' : preset.value)}
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
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isSelected ? primary : text }}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
                {/* Custom Date Option */}
                <Pressable
                  onPress={() => {
                    setSelectedDatePreset('custom');
                    setShowCustomDatePicker(true);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 18,
                    borderRadius: 14,
                    backgroundColor: selectedDatePreset === 'custom' ? 'transparent' : cardBackground,
                    borderWidth: selectedDatePreset === 'custom' ? 2 : 0,
                    borderColor: primary,
                    overflow: 'hidden',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {selectedDatePreset === 'custom' && (
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: primary, opacity: 0.1 }} />
                  )}
                  <Calendar size={14} color={selectedDatePreset === 'custom' ? primary : text} />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: selectedDatePreset === 'custom' ? primary : text }}>
                    Custom
                  </Text>
                </Pressable>
              </View>

              {/* Custom Date Picker */}
              {selectedDatePreset === 'custom' && (
                <View style={{ marginTop: 16, padding: 16, backgroundColor: cardBackground, borderRadius: 12, borderWidth: 1, borderColor: border }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: text, marginBottom: 12 }}>
                    Select date range
                  </Text>
                  <View style={{ gap: 12 }}>
                    <Pressable
                      onPress={() => setShowCustomDatePicker(true)}
                      style={{ paddingVertical: 12, paddingHorizontal: 12, backgroundColor: background, borderRadius: 10, borderWidth: 1, borderColor: border }}
                    >
                      <Text style={{ color: customDateFrom ? text : textMuted, fontSize: 14, fontWeight: '600' }}>
                        From: {customDateFrom ? customDateFrom.toLocaleDateString() : 'Select date'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setShowCustomDatePicker(true)}
                      style={{ paddingVertical: 12, paddingHorizontal: 12, backgroundColor: background, borderRadius: 10, borderWidth: 1, borderColor: border }}
                    >
                      <Text style={{ color: customDateTo ? text : textMuted, fontSize: 14, fontWeight: '600' }}>
                        To: {customDateTo ? customDateTo.toLocaleDateString() : 'Select date'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Date Picker Modal */}
              <CustomDateRangePicker
                visible={showCustomDatePicker}
                onClose={() => setShowCustomDatePicker(false)}
                onApply={(startDate, endDate) => {
                  setCustomDateFrom(startDate);
                  setCustomDateTo(endDate);
                  setShowCustomDatePicker(false);
                }}
                initialStartDate={customDateFrom}
                initialEndDate={customDateTo}
                theme={{ primary, background, text, cardBackground }}
              />
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
                  const decodedName = decodeHtmlEntities(genre.name);
                  const isSelected = selectedGenres.includes(genre.name);
                  return (
                    <Pressable
                      key={genre.id}
                      onPress={() => toggleGenre(genre.name)}
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
                        {decodedName}
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
                const decodedVenueName = decodeHtmlEntities(venue.venue);
                const isSelected = selectedVenues.includes(venue.venue);
                return (
                  <Pressable
                    key={venue.id}
                    onPress={() => toggleVenue(venue.venue)}
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
                        {decodedVenueName}
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