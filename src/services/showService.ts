/**
 * @service showService
 * @description Service for filtering and querying live music shows with advanced criteria
 * 
 * @usage
 * import { showService } from '../services/showService'
 * 
 * const shows = await showService.getShows({ city: 'Kelowna', genres: ['Rock', 'Blues'] })
 */

import magically from 'magically-sdk';
import { Show } from '../magically/entities/Show';

export interface ShowFilters {
  city?: 'Kelowna' | 'Nelson';
  genres?: string[];
  venues?: string[];
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  artists?: string[];
  searchTerm?: string;
}

class ShowService {
  /**
   * Get shows with optional filters
   */
  async getShows(filters: ShowFilters = {}): Promise<Show[]> {
    try {
      const query: any = { isPublic: true };

      // City filter
      if (filters.city) {
        query.city = filters.city;
      }

      // Always filter out past events - only show current date to next 30 days
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        // Use the later of today or filters.dateFrom
        if (filters.dateFrom) {
          query.date.$gte = filters.dateFrom >= todayStr ? filters.dateFrom : todayStr;
        } else {
          query.date.$gte = todayStr; // Default: show only today and future
        }
        if (filters.dateTo) {
          query.date.$lte = filters.dateTo;
        }
      } else {
        // No date filter provided, default to today to next 30 days
        query.date = { $gte: todayStr, $lte: thirtyDaysStr };
      }

      const result = await magically.data.query<Show>('shows', query, {
        sort: { date: 1, time: 1 }, // Sort by date and time
        limit: 100,
      });

      let shows = result.data;

      // Client-side filtering for array fields
      if (filters.genres && filters.genres.length > 0) {
        shows = shows.filter(show => 
          show.genre.some(g => filters.genres!.includes(g))
        );
      }

      if (filters.venues && filters.venues.length > 0) {
        shows = shows.filter(show => 
          filters.venues!.includes(show.venue)
        );
      }

      if (filters.artists && filters.artists.length > 0) {
        shows = shows.filter(show => 
          filters.artists!.some(artist => 
            show.artist.toLowerCase().includes(artist.toLowerCase())
          )
        );
      }

      // Search term filter
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        shows = shows.filter(show => 
          show.artist.toLowerCase().includes(term) ||
          show.venue.toLowerCase().includes(term) ||
          show.title.toLowerCase().includes(term) ||
          show.genre.some(g => g.toLowerCase().includes(term))
        );
      }

      return shows;
    } catch (error) {
      console.error('Error fetching shows:', error);
      return [];
    }
  }

  /**
   * Get shows by IDs
   */
  async getShowsByIds(ids: string[]): Promise<Show[]> {
    try {
      if (ids.length === 0) return [];
      
      const result = await magically.data.query<Show>('shows', { 
        _id: { $in: ids },
        isPublic: true 
      });
      return result.data;
    } catch (error) {
      console.error('Error fetching shows by IDs:', error);
      return [];
    }
  }

  /**
   * Get unique venues from all shows
   */
  async getVenues(city?: 'Kelowna' | 'Nelson'): Promise<string[]> {
    try {
      const query: any = { isPublic: true };
      if (city) {
        query.city = city;
      }

      const result = await magically.data.query<Show>('shows', query, { limit: 100 });
      const venues = [...new Set(result.data.map(show => show.venue))];
      return venues.sort();
    } catch (error) {
      console.error('Error fetching venues:', error);
      return [];
    }
  }

  /**
   * Get unique genres from all shows
   */
  async getGenres(): Promise<string[]> {
    try {
      const result = await magically.data.query<Show>('shows', { isPublic: true }, { limit: 100 });
      const allGenres = result.data.flatMap(show => show.genre);
      const uniqueGenres = [...new Set(allGenres)];
      return uniqueGenres.sort();
    } catch (error) {
      console.error('Error fetching genres:', error);
      return [];
    }
  }

  /**
   * Get shows matching user's favorite preferences
   */
  async getFavoriteShows(
    favoriteGenres: string[],
    favoriteVenues: string[],
    favoriteArtists: string[],
    city?: 'Kelowna' | 'Nelson'
  ): Promise<Show[]> {
    try {
      const allShows = await this.getShows({ city });
      
      const matchingShows = allShows.filter(show => {
        const matchesGenre = favoriteGenres.length === 0 || 
          show.genre.some(g => favoriteGenres.includes(g));
        
        const matchesVenue = favoriteVenues.length === 0 || 
          favoriteVenues.includes(show.venue);
        
        const matchesArtist = favoriteArtists.length === 0 || 
          favoriteArtists.some(artist => 
            show.artist.toLowerCase().includes(artist.toLowerCase())
          );
        
        return matchesGenre || matchesVenue || matchesArtist;
      });

      return matchingShows;
    } catch (error) {
      console.error('Error fetching favorite shows:', error);
      return [];
    }
  }

  /**
   * Get quick date filter presets
   */
  getDatePresets() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);

    return {
      tonight: {
        label: 'Tonight',
        dateFrom: today.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
      },
      tomorrow: {
        label: 'Tomorrow',
        dateFrom: tomorrow.toISOString().split('T')[0],
        dateTo: tomorrow.toISOString().split('T')[0],
      },
      thisWeek: {
        label: 'This Week',
        dateFrom: today.toISOString().split('T')[0],
        dateTo: endOfWeek.toISOString().split('T')[0],
      },
      next30Days: {
        label: 'Next 30 Days',
        dateFrom: today.toISOString().split('T')[0],
        dateTo: thirtyDaysFromNow.toISOString().split('T')[0],
      },
      thisMonth: {
        label: 'This Month',
        dateFrom: startOfMonth.toISOString().split('T')[0],
        dateTo: endOfMonth.toISOString().split('T')[0],
      },
      nextMonth: {
        label: 'Next Month',
        dateFrom: nextMonth.toISOString().split('T')[0],
        dateTo: endOfNextMonth.toISOString().split('T')[0],
      },
    };
  }
}

export const showService = new ShowService();
