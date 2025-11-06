/**
 * Data Service
 * Handles loading and caching categories and venues data
 */

import { fetchGenres, fetchVenues, WordPressCategory, WordPressVenue } from './eventService';
import { useUserPreferences } from '../stores/userPreferencesStore';

export class DataService {
  /**
   * Load categories for a city
   */
  static async loadCategories(city: 'kelowna' | 'nelson'): Promise<WordPressCategory[]> {
    try {
      console.log(` ~ DataService ~ Loading categories for ${city}`);
      const categories = await fetchGenres(city === 'kelowna' ? 'Kelowna' : 'Nelson');
      return categories;
    } catch (error) {
      console.error('Error loading categories:', error);
      return [];
    }
  }

  /**
   * Load venues for a city
   */
  static async loadVenues(city: 'kelowna' | 'nelson'): Promise<WordPressVenue[]> {
    try {
      console.log(` ~ DataService ~ Loading venues for ${city}`);
      const venues = await fetchVenues(city === 'kelowna' ? 'Kelowna' : 'Nelson');
      return venues;
    } catch (error) {
      console.error('Error loading venues:', error);
      return [];
    }
  }

  /**
   * Preload data for both cities
   */
  static async preloadData(): Promise<void> {
    console.log('🚀 ~ DataService ~ Preloading data for both cities');

    const promises = [
      this.loadCategories('kelowna'),
      this.loadCategories('nelson'),
      this.loadVenues('kelowna'),
      this.loadVenues('nelson'),
    ];

    try {
      await Promise.all(promises);
      console.log('✅ ~ DataService ~ Data preloaded successfully');
    } catch (error) {
      console.error('❌ ~ DataService ~ Error preloading data:', error);
    }
  }

  /**
   * Get categories for a city (returns empty array since we don't cache anymore)
   */
  static getCategories(city: 'kelowna' | 'nelson'): WordPressCategory[] {
    return [];
  }

  /**
   * Get venues for a city (returns empty array since we don't cache anymore)
   */
  static getVenues(city: 'kelowna' | 'nelson'): WordPressVenue[] {
    return [];
  }

  /**
   * Check if categories are loading (always false since we don't track loading state)
   */
  static isLoadingCategories(): boolean {
    return false;
  }

  /**
   * Check if venues are loading (always false since we don't track loading state)
   */
  static isLoadingVenues(): boolean {
    return false;
  }

  /**
   * Clear cache (no-op since we don't cache anymore)
   */
  static clearCache(): void {
    // No-op
  }
}
