/**
 * @store filterStore
 * @description Manages filter state shared between FilterScreen and ShowsScreen
 */

import { create } from 'zustand';

export interface ShowFilters {
  genres: string[];
  venues: string[];
  datePreset: string;
  dateFrom?: string;
  dateTo?: string;
}

interface FilterStore {
  // Current active filters
  activeFilters: ShowFilters;
  
  // Update filters
  setFilters: (filters: Partial<ShowFilters>) => void;
  
  // Clear all filters
  clearFilters: () => void;
  
  // Check if any filters are active
  hasActiveFilters: () => boolean;
}

const initialFilters: ShowFilters = {
  genres: [],
  venues: [],
  datePreset: '',
};

export const useFilterStore = create<FilterStore>((set, get) => ({
  activeFilters: initialFilters,
  
  setFilters: (filters) => {
    set((state) => ({
      activeFilters: {
        ...state.activeFilters,
        ...filters,
      },
    }));
  },
  
  clearFilters: () => {
    set({ activeFilters: initialFilters });
  },
  
  hasActiveFilters: () => {
    const { activeFilters } = get();
    return (
      activeFilters.genres.length > 0 ||
      activeFilters.venues.length > 0 ||
      activeFilters.datePreset !== ''
    );
  },
}));
