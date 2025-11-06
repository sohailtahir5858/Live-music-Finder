/**
 * @store userPreferencesStore
 * @description Zustand store for managing user preferences including favorite genres, venues, artist  toggleFavoriteShow: (show) => {
    const { favoriteShows } = get();
    
    const updated = favoriteShows.find(s => s._id === show._id)
      ? favoriteShows.filter(s => s._id !== show._id)
      : [...favoriteShows, show];
    
    set({ favoriteShows: updated });
    get().savePreferences({ favoriteShows: updated.map(s => s._id) });
  },d city, and notification settings
 * 
 * @usage
 * import { useUserPreferences } from '../stores/userPreferencesStore'
 * 
 * const { selectedCity, setSelectedCity, favoriteGenres, toggleFavoriteGenre } = useUserPreferences()
 */

import { create } from 'zustand';
import magically from 'magically-sdk';
import { Show } from '../magically/entities/Show';
import { WordPressCategory, WordPressVenue } from '../services/eventService';

interface UserPreference {
  selectedCity?: 'Kelowna' | 'Nelson';
  hasSelectedCity?: boolean;
  favoriteGenres?: string[];
  favoriteVenues?: string[];
  favoriteArtists?: string[];
  favoriteShows?: string[];
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
  favoriteGenres: Record<'Kelowna' | 'Nelson', string[]>;
  allGenres: WordPressCategory[];
  allVenues: WordPressVenue[];
  favoriteVenues: Record<'Kelowna' | 'Nelson', string[]>;
  favoriteArtists: string[];
  favoriteShows: Show[];
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
  toggleFavoriteShow: (show: Show) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setNotificationFrequency: (frequency: 'instant' | 'daily' | 'weekly') => void;
  setIsPremium: (premium: boolean) => void;
  setViewMode: (mode: 'card' | 'list') => void;
  loadPreferences: () => Promise<void>;
  savePreferences: (partial?: Partial<UserPreferencesState>) => Promise<void>;
  resetPreferences: () => void;
  setAllGenres: (genres: WordPressCategory[]) => void;
  setAllVenues: (venues: WordPressVenue[]) => void;
  loadAllGenres: (city: 'Kelowna' | 'Nelson') => Promise<void>;
  loadAllVenues: (city: 'Kelowna' | 'Nelson') => Promise<void>;
  getCurrentCityFavorites: () => { genres: string[]; venues: string[] };
  cleanupInvalidFavorites: (city: 'Kelowna' | 'Nelson') => void;
}

const DEFAULT_PREFERENCES = {
  selectedCity: 'Kelowna' as const,
  hasSelectedCity: false,
  favoriteGenres: { Kelowna: [], Nelson: [] },
  favoriteVenues: { Kelowna: [], Nelson: [] },
  favoriteArtists: [],
  favoriteShows: [],
  allGenres: [],
  allVenues: [],
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
    
    // Load genres and venues for the new city
    Promise.all([
      get().loadAllGenres(city),
      get().loadAllVenues(city)
    ]).then(() => {
      // Clean up favorites that don't exist in the new city after data loads successfully
      setTimeout(() => {
        get().cleanupInvalidFavorites(city);
      }, 100);
    }).catch((error) => {
      console.error('[CitySwitch] Error loading data for', city, error);
      // Don't clean up if data loading failed
    });
    
    get().savePreferences();
  },

  toggleFavoriteGenre: (genre) => {
    const { favoriteGenres, selectedCity, isPremium, allGenres } = get();
    const currentCityGenres = favoriteGenres[selectedCity];
    
    // Check if genre exists in current city's available genres
    const genreExists = allGenres.some(g => g.name === genre);
    if (!genreExists) {
      console.warn(`[Genres] Genre "${genre}" not found in current city data`);
      return;
    }

    const isCurrentlySelected = currentCityGenres.includes(genre);

    if (isCurrentlySelected) {
      // Allow removing
      const updated = currentCityGenres.filter(g => g !== genre);
      const newFavoriteGenres = { ...favoriteGenres, [selectedCity]: updated };
      set({ favoriteGenres: newFavoriteGenres });
      get().savePreferences();
    } else {
      // Check limit for free users
      if (!isPremium && currentCityGenres.length >= 3) {
        console.log('[Genres] Free user reached 3 genre limit for', selectedCity);
        return;
      }

      // Allow adding
      const updated = [...currentCityGenres, genre];
      const newFavoriteGenres = { ...favoriteGenres, [selectedCity]: updated };
      set({ favoriteGenres: newFavoriteGenres });
      get().savePreferences();
    }
  },

  toggleFavoriteVenue: (venue) => {
    console.log("🚀 ~ venue:", venue)
    const { favoriteVenues, selectedCity, isPremium, allVenues } = get();
    const currentCityVenues = favoriteVenues[selectedCity];
    console.log("🚀 ~ currentCityVenues:", currentCityVenues)
    
    // Check if venue exists in current city's available venues
    const venueExists = allVenues.some(v => v.venue === venue);
    console.log("🚀 ~ venueExists:", venueExists)
    if (!venueExists) {
      console.warn(`[Venues] Venue "${venue}" not found in current city data`);
      return;
    }

    const isCurrentlySelected = currentCityVenues.includes(venue);

    if (isCurrentlySelected) {
      // Allow removing
      const updated = currentCityVenues.filter(v => v !== venue);
      const newFavoriteVenues = { ...favoriteVenues, [selectedCity]: updated };
      set({ favoriteVenues: newFavoriteVenues });
      get().savePreferences();
    } else {
      // Check limit for free users
      if (!isPremium && currentCityVenues.length >= 3) {
        console.log('[Venues] Free user reached 3 venue limit for', selectedCity);
        return;
      }

      // Allow adding
      const updated = [...currentCityVenues, venue];
      console.log("🚀 ~ updated:", updated)
      const newFavoriteVenues = { ...favoriteVenues, [selectedCity]: updated };
      console.log("🚀 ~ newFavoriteVenues:", newFavoriteVenues)
      set({ favoriteVenues: newFavoriteVenues });
      get().savePreferences();
    }
  },

  toggleFavoriteArtist: (artist) => {
    const { favoriteArtists, isPremium } = get();
    
    // Free users limited to 3 favorite artists
    if (!isPremium && !favoriteArtists.includes(artist) && favoriteArtists.length >= 3) {
      return;
    }
    
    const updated = favoriteArtists.includes(artist)
      ? favoriteArtists.filter(a => a !== artist)
      : [...favoriteArtists, artist];
    
    set({ favoriteArtists: updated });
    get().savePreferences();
  },

  toggleFavoriteShow: (show) => {
    const { favoriteShows } = get();
    
    const updated = favoriteShows.find(s => s._id === show._id)
      ? favoriteShows.filter(s => s._id !== show._id)
      : [...favoriteShows, show];
    
    set({ favoriteShows: updated });
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
  setAllGenres(genres) {
    set({ allGenres: genres });
  },
  setAllVenues(venues) {
    set({ allVenues: venues });
  },

  loadAllGenres: async (city) => {
    try {
      const baseUrl = city.toLowerCase() === 'nelson'
        ? 'https://livemusicnelson.ca/wp-json/tribe/events/v1/categories/'
        : 'https://livemusickelowna.ca/wp-json/tribe/events/v1/categories/';

      let allGenres: WordPressCategory[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const url = `${baseUrl}?page=${page}&per_page=100`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.categories && data.categories.length > 0) {
          allGenres = [...allGenres, ...data.categories];
          hasNextPage = !!data.next_rest_url;
          page++;
        } else {
          hasNextPage = false;
        }
      }

      console.log(`[Genres] Loaded ${allGenres.length} genres for ${city}`);
      get().setAllGenres(allGenres);
    } catch (error) {
      console.error('[Genres] Error loading genres:', error);
      get().setAllGenres([]);
    }
  },

  loadAllVenues: async (city) => {
    try {
      const baseUrl = city.toLowerCase() === 'nelson'
        ? 'https://livemusicnelson.ca/wp-json/tribe/events/v1/venues/'
        : 'https://livemusickelowna.ca/wp-json/tribe/events/v1/venues/';

      let allVenues: WordPressVenue[] = [];
      let page = 1;
      let hasNextPage = true;

      while (hasNextPage) {
        const url = `${baseUrl}?page=${page}&per_page=100&status=publish`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.venues && data.venues.length > 0) {
          allVenues = [...allVenues, ...data.venues];
          hasNextPage = !!data.next_rest_url;
          page++;
        } else {
          hasNextPage = false;
        }
      }

      console.log(`[Venues] Loaded ${allVenues.length} venues for ${city}`);
      get().setAllVenues(allVenues);
    } catch (error) {
      console.error('[Venues] Error loading venues:', error);
      get().setAllVenues([]);
    }
  },

  getCurrentCityFavorites: () => {
    const { favoriteGenres, favoriteVenues, selectedCity } = get();
    return {
      genres: favoriteGenres[selectedCity] || [],
      venues: favoriteVenues[selectedCity] || []
    };
  },

  cleanupInvalidFavorites: (city: 'Kelowna' | 'Nelson') => {
    const state = get();
    const { favoriteGenres, favoriteVenues, allGenres, allVenues, isPremium } = state;

    const currentCityGenres = favoriteGenres[city] || [];
    const currentCityVenues = favoriteVenues[city] || [];

    // Don't clean up if data hasn't loaded yet (empty arrays)
    if (allGenres.length === 0 && allVenues.length === 0) {
      console.log(`[Cleanup] Skipping cleanup for ${city} - no data loaded yet`);
      return;
    }

    // Get available genre names for current city
    const availableGenreNames = allGenres.map(g => g.name);
    // Get available venue names for current city
    const availableVenueNames = allVenues.map(v => v.venue);

    // Filter favorites to only include available items
    const validFavoriteGenres = currentCityGenres.filter((genre: string) => availableGenreNames.includes(genre));
    const validFavoriteVenues = currentCityVenues.filter((venue: string) => availableVenueNames.includes(venue));

    // For free users, limit to 3 favorites
    const limitedFavoriteGenres = isPremium ? validFavoriteGenres : validFavoriteGenres.slice(0, 3);
    const limitedFavoriteVenues = isPremium ? validFavoriteVenues : validFavoriteVenues.slice(0, 3);

    // Update state if anything changed
    if (validFavoriteGenres.length !== currentCityGenres.length ||
        validFavoriteVenues.length !== currentCityVenues.length ||
        limitedFavoriteGenres.length !== validFavoriteGenres.length ||
        limitedFavoriteVenues.length !== validFavoriteVenues.length) {

      console.log(`[Cleanup] City changed to ${city}, cleaned up favorites:`, {
        genresBefore: currentCityGenres.length,
        genresAfter: limitedFavoriteGenres.length,
        venuesBefore: currentCityVenues.length,
        venuesAfter: limitedFavoriteVenues.length,
        isPremium
      });

      const newFavoriteGenres = { ...favoriteGenres, [city]: limitedFavoriteGenres };
      const newFavoriteVenues = { ...favoriteVenues, [city]: limitedFavoriteVenues };

      set({
        favoriteGenres: newFavoriteGenres,
        favoriteVenues: newFavoriteVenues
      });
    }
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
        
        // Handle migration from old array format to new Record format
        let favoriteGenres = DEFAULT_PREFERENCES.favoriteGenres;
        let favoriteVenues = DEFAULT_PREFERENCES.favoriteVenues;
        
        if (prefs.favoriteGenres) {
          if (Array.isArray(prefs.favoriteGenres)) {
            // Old format: migrate to Record format
            favoriteGenres = {
              Kelowna: prefs.favoriteGenres.slice(0, 3), // Limit to 3 for free users
              Nelson: []
            };
          } else {
            // New format: ensure both cities exist
            favoriteGenres = {
              Kelowna: prefs.favoriteGenres.Kelowna || [],
              Nelson: prefs.favoriteGenres.Nelson || []
            };
          }
        }
        
        if (prefs.favoriteVenues) {
          if (Array.isArray(prefs.favoriteVenues)) {
            // Old format: migrate to Record format
            favoriteVenues = {
              Kelowna: prefs.favoriteVenues.slice(0, 3), // Limit to 3 for free users
              Nelson: []
            };
          } else {
            // New format: ensure both cities exist
            favoriteVenues = {
              Kelowna: prefs.favoriteVenues.Kelowna || [],
              Nelson: prefs.favoriteVenues.Nelson || []
            };
          }
        }
        
        set({
          selectedCity: prefs.selectedCity || DEFAULT_PREFERENCES.selectedCity,
          hasSelectedCity: !!prefs.selectedCity, // Set to true if city was previously selected
          favoriteGenres,
          favoriteVenues,
          favoriteArtists: prefs.favoriteArtists || [],
          favoriteShows: prefs.favoriteShows || [],
          notificationsEnabled: prefs.notificationsEnabled ?? true,
          notificationFrequency: prefs.notificationFrequency || 'instant',
          isPremium: prefs.isPremium || false,
          viewMode: prefs.viewMode || 'card',
          hasLoadedPreferences: true,
          isLoading: false,
        });

        // Clean up invalid favorites after loading
        setTimeout(() => {
          get().cleanupInvalidFavorites(prefs.selectedCity || DEFAULT_PREFERENCES.selectedCity);
        }, 100);
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
        favoriteShows: state.favoriteShows,
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
      console.log('[Prefs] Error saving preferences:', error);
    }
  },

  resetPreferences: () => {
    set({ 
      ...DEFAULT_PREFERENCES,
      hasLoadedPreferences: false 
    });
  },
}));