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

      // Always filter out past events - only show tomorrow and future
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        query.date = {};
        // Use the later of tomorrow or filters.dateFrom
        if (filters.dateFrom) {
          query.date.$gte = filters.dateFrom >= tomorrowStr ? filters.dateFrom : tomorrowStr;
        } else {
          query.date.$gte = tomorrowStr; // Default: show only tomorrow and future
        }
        if (filters.dateTo) {
          query.date.$lte = filters.dateTo;
        }
      } else {
        // No date filter provided, default to tomorrow and future
        query.date = { $gte: tomorrowStr };
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
   * Get a single show by ID
   */
  async getShowById(id: string): Promise<Show | null> {
    try {
      const result = await magically.data.query<Show>('shows', { 
        _id: id,
        isPublic: true 
      });
      return result.data[0] || null;
    } catch (error) {
      console.error('Error fetching show:', error);
      return null;
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
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - today.getDay()));
    
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

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
      thisMonth: {
        label: 'This Month',
        dateFrom: today.toISOString().split('T')[0],
        dateTo: endOfMonth.toISOString().split('T')[0],
      },
    };
  }
}

export const showService = new ShowService();
