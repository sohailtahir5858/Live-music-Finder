/**
 * @store userPreferencesStore
 * @description Zustand store for managing user preferences including favorite genres, venues, artists, selected city, and notification settings
 * 
 * @usage
 * import { useUserPreferences } from '../stores/userPreferencesStore'
 * 
 * const { selectedCity, setSelectedCity, favoriteGenres, toggleFavoriteGenre } = useUserPreferences()
 */

import { create } from 'zustand';
import magically from 'magically-sdk';

interface UserPreference {
  selectedCity?: 'Kelowna' | 'Nelson';
  hasSelectedCity?: boolean;
  favoriteGenres?: string[];
  favoriteVenues?: string[];
  favoriteArtists?: string[];
  notificationsEnabled?: boolean;
  notificationFrequency?: 'instant' | 'daily' | 'weekly';
  isPremium?: boolean;
  viewMode?: 'card' | 'list';
  _id: string;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPreferencesState {
  // Preferences
  selectedCity: 'Kelowna' | 'Nelson';
  hasSelectedCity: boolean;
  favoriteGenres: string[];
  favoriteVenues: string[];
  favoriteArtists: string[];
  notificationsEnabled: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  isPremium: boolean;
  viewMode: 'card' | 'list';
  
  // Loading state
  isLoading: boolean;
  hasLoadedPreferences: boolean;
  
  // Actions
  setSelectedCity: (city: 'Kelowna' | 'Nelson') => void;
  toggleFavoriteGenre: (genre: string) => void;
  toggleFavoriteVenue: (venue: string) => void;
  toggleFavoriteArtist: (artist: string) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationFrequency: (frequency: 'instant' | 'daily' | 'weekly') => void;
  setIsPremium: (premium: boolean) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  loadPreferences: () => Promise<void>;
  savePreferences: () => Promise<void>;
  resetPreferences: () => void;
}

const DEFAULT_PREFERENCES = {
  selectedCity: 'Kelowna' as const,
  hasSelectedCity: false,
  favoriteGenres: [],
  favoriteVenues: [],
  favoriteArtists: [],
  notificationsEnabled: true,
  notificationFrequency: 'instant' as const,
  isPremium: false,
  viewMode: 'card' as const,
};

export const useUserPreferences = create<UserPreferencesState>((set, get) => ({
  // Initial state
  ...DEFAULT_PREFERENCES,
  isLoading: false,
  hasLoadedPreferences: false,

  setSelectedCity: (city) => {
    set({ selectedCity: city, hasSelectedCity: true });
    get().savePreferences();
  },

  toggleFavoriteGenre: (genre) => {
    const { favoriteGenres, isPremium } = get();
    
    // Free users limited to 2 favorite genres
    if (!isPremium && !favoriteGenres.includes(genre) && favoriteGenres.length >= 2) {
      return; // Don't add if at limit
    }
    
    const updated = favoriteGenres.includes(genre)
      ? favoriteGenres.filter(g => g !== genre)
      : [...favoriteGenres, genre];
    
    set({ favoriteGenres: updated });
    get().savePreferences();
  },

  toggleFavoriteVenue: (venue) => {
    const { favoriteVenues, isPremium } = get();
    
    // Free users limited to 2 favorite venues
    if (!isPremium && !favoriteVenues.includes(venue) && favoriteVenues.length >= 2) {
      return;
    }
    
    const updated = favoriteVenues.includes(venue)
      ? favoriteVenues.filter(v => v !== venue)
      : [...favoriteVenues, venue];
    
    set({ favoriteVenues: updated });
    get().savePreferences();
  },

  toggleFavoriteArtist: (artist) => {
    const { favoriteArtists, isPremium } = get();
    
    // Free users limited to 2 favorite artists
    if (!isPremium && !favoriteArtists.includes(artist) && favoriteArtists.length >= 2) {
      return;
    }
    
    const updated = favoriteArtists.includes(artist)
      ? favoriteArtists.filter(a => a !== artist)
      : [...favoriteArtists, artist];
    
    set({ favoriteArtists: updated });
    get().savePreferences();
  },

  setNotificationsEnabled: (enabled) => {
    set({ notificationsEnabled: enabled });
    get().savePreferences();
  },

  setNotificationFrequency: (frequency) => {
    set({ notificationFrequency: frequency });
    get().savePreferences();
  },

  setIsPremium: (premium) => {
    set({ isPremium: premium });
    get().savePreferences();
  },

  setViewMode: (mode) => {
    set({ viewMode: mode });
    get().savePreferences();
  },

  loadPreferences: async () => {
    try {
      set({ isLoading: true });
      
      // Check if user is authenticated
      if (!magically.auth.currentUser) {
        console.log('[Prefs] No auth user, using defaults');
        set({ 
          ...DEFAULT_PREFERENCES,
          hasLoadedPreferences: true,
          isLoading: false 
        });
        return;
      }

      console.log('[Prefs] Loading preferences for user:', magically.auth.currentUser);
      const result = await magically.data.query('user_preferences', {});
      
      if (result.data && result.data.length > 0) {
        const prefs = result.data[0] as any;
        console.log('[Prefs] Found saved preferences:', prefs);
        set({
          selectedCity: prefs.selectedCity || DEFAULT_PREFERENCES.selectedCity,
          hasSelectedCity: !!prefs.selectedCity, // Set to true if city was previously selected
          favoriteGenres: prefs.favoriteGenres || [],
          favoriteVenues: prefs.favoriteVenues || [],
          favoriteArtists: prefs.favoriteArtists || [],
          notificationsEnabled: prefs.notificationsEnabled ?? true,
          notificationFrequency: prefs.notificationFrequency || 'instant',
          isPremium: prefs.isPremium || false,
          viewMode: prefs.viewMode || 'card',
          hasLoadedPreferences: true,
          isLoading: false,
        });
      } else {
        // No preferences found, use defaults
        console.log('[Prefs] No saved preferences, using defaults');
        set({ 
          ...DEFAULT_PREFERENCES,
          hasLoadedPreferences: true,
          isLoading: false 
        });
      }
    } catch (error) {
      console.error('[Prefs] Error loading preferences:', error);
      set({ 
        ...DEFAULT_PREFERENCES,
        hasLoadedPreferences: true,
        isLoading: false 
      });
    }
  },

  savePreferences: async () => {
    try {
      // Only save if user is authenticated
      if (!magically.auth.currentUser) {
        console.log('[Prefs] Cannot save - no authenticated user');
        return;
      }

      const state = get();
      const prefsData = {
        selectedCity: state.selectedCity,
        favoriteGenres: state.favoriteGenres,
        favoriteVenues: state.favoriteVenues,
        favoriteArtists: state.favoriteArtists,
        notificationsEnabled: state.notificationsEnabled,
        notificationFrequency: state.notificationFrequency,
        isPremium: state.isPremium,
        viewMode: state.viewMode,
      };

      console.log('[Prefs] Saving preferences:', prefsData);

      // Check if preferences exist
      const existing = await magically.data.query('user_preferences', {});
      
      if (existing.data && existing.data.length > 0) {
        // Update existing
        console.log('[Prefs] Updating existing preferences');
        await magically.data.update('user_preferences', { _id: existing.data[0]._id }, prefsData);
      } else {
        // Create new
        console.log('[Prefs] Creating new preferences');
        await magically.data.insert('user_preferences', prefsData);
      }
      console.log('[Prefs] Preferences saved successfully');
    } catch (error) {
      console.error('[Prefs] Error saving preferences:', error);
    }
  },

  resetPreferences: () => {
    set({ 
      ...DEFAULT_PREFERENCES,
      hasLoadedPreferences: false 
    });
  },
}));