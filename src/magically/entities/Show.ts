/**
 * Auto-generated entity for Show
 * Generated from magically/schemas/Show.json
 * Collection: shows
 * @entity Show
 * @import { Show, Shows } from '../magically/entities/Show'
 * @collection shows
 * @description Show entity with full CRUD operations and TypeScript types
 * 
 * @type
 * interface Show {
 *   title: string
 *   artist: string
 *   venue: string
 *   venueAddress?: string
 *   city: "Kelowna" | "Nelson"
 *   date: string
 *   time: string
 *   genre: string[]
 *   description?: string
 *   imageUrl?: string
 *   price?: string
 *   capacity?: number
 *   popularity?: number
 *   isPublic: boolean
 *   // Standard fields (always present after save)
 *   _id: string
 *   creator: string  
 *   createdAt: Date
 *   updatedAt: Date
 *   isPublic?: boolean
 * }
 * 
 * @query-options
 * QueryOptions {
 *   limit?: number (max: 100)
 *   skip?: number (offset for pagination)
 *   sort?: any (MongoDB sort, e.g., { createdAt: -1 })
 * }
 * 
 * @query-result
 * QueryResult<T> {
 *   data: T[]
 *   total: number
 * }
 * 
 * @important
 * - Uses magically.data SDK methods internally
 * - All data is scoped to current user unless isPublic: true
 * - ShowCreateInput omits: _id, creator, createdAt, updatedAt
 * - ShowUpdateInput is Partial<Show> excluding: _id, creator, createdAt
 * - Protected collections: users, files (use dedicated userProfiles instead)
 */

import magically from "magically-sdk";

export interface Show {
  /** Show title or artist name */
  title: string;
  /** Artist or band name */
  artist: string;
  /** Venue name */
  venue: string;
  /** Full venue address */
  venueAddress?: string;
  /** City: Kelowna or Nelson */
  city: "Kelowna" | "Nelson";
  /** Show date in YYYY-MM-DD format */
  date: string;
  /** Show time (e.g., 8:00 PM) */
  time: string;
  /** Array of genres (rock, jazz, blues, country, electronic, indie, folk, pop, metal) */
  genre: string[];
  /** Show description or details */
  description?: string;
  /** Show or artist image URL */
  imageUrl?: string;
  /** Ticket price (e.g., $25, Free) */
  price?: string;
  /** Venue capacity */
  capacity?: number;
  /** Popularity rating (0-5) */
  popularity?: number;
  /** Public data visible to all users */
  isPublic: boolean;
  /** MongoDB document ID - automatically generated */
  _id: string;
  /** User who created this document - automatically set from auth */
  creator: string;
  /** When document was created - automatically set */
  createdAt: Date;
  /** When document was last updated - automatically managed */
  updatedAt: Date;
  /** Whether document is publicly visible - defaults to false */
  isPublic?: boolean;
}

export interface ShowCreateInput extends Omit<Show, '_id' | 'creator' | 'createdAt' | 'updatedAt'> {
  isPublic?: boolean; // Optional - defaults to false if not provided
}
export interface ShowUpdateInput extends Partial<Omit<Show, '_id' | 'creator' | 'createdAt'>> {}

export const Shows = {
  /**
   * Create a new Show (insertOne)
   */
  async save(data: ShowCreateInput, options: { upsert?: boolean } = {}): Promise<Show> {
    return magically.data.insert<Show>("shows", data, options);
  },

  /**
   * Create a new Show (insertOne)
   */
  async create(data: ShowCreateInput, options: {  } = {}): Promise<Show> {
    return magically.data.insert<Show>("shows", data, options);
  },

  /**
   * Upsert Show - update if exists, create if not
   */
  async upsert(filter: Partial<Show>, data: ShowCreateInput): Promise<{ data: Show; upserted: boolean }> {
    return magically.data.upsert<Show>("shows", filter, data);
  },

  /**
   * Find Show by ID (findOne by _id)
   * Automatically includes public items to support unauthenticated access
   */
  async findById(id: string): Promise<Show | null> {
    const result = await magically.data.query<Show>("shows", { 
      _id: id,
      isPublic: true 
    });
    return result.data[0] || null;
  },

  /**
   * Query Shows with filters and options (find)
   */
  async query(
    filter: Partial<Show> = {},
    options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}
  ): Promise<{ data: Show[]; total: number }> {
    return magically.data.query<Show>("shows", filter, options);
  },

  /**
   * List all Shows with pagination
   */
  async list(options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}): Promise<{ data: Show[]; total: number }> {
    return magically.data.query<Show>("shows", {}, options);
  },

  /**
   * Update Show by ID (updateOne)
   */
  async update(id: string, data: ShowUpdateInput): Promise<Show> {
    return magically.data.update<Show>("shows", { _id: id }, data);
  },

  /**
   * Update multiple Shows matching filter (updateMany)
   */
  async updateMany(filter: Partial<Show>, data: ShowUpdateInput): Promise<{ matchedCount: number; modifiedCount: number }> {
    return magically.data.updateMany<Show>("shows", filter, data);
  },

  /**
   * Delete Show by ID (deleteOne by _id)
   */
  async delete(id: string): Promise<boolean> {
    const result = await magically.data.deleteOne("shows", { _id: id });
    return result.deletedCount > 0;
  },

  /**
   * Delete one Show matching filter (deleteOne)
   */
  async deleteOne(filter: Partial<Show>): Promise<{ deletedCount: number }> {
    return magically.data.deleteOne("shows", filter);
  },

  /**
   * Delete multiple Shows matching filter (deleteMany)
   */
  async deleteMany(filter: Partial<Show>): Promise<{ deletedCount: number }> {
    return magically.data.deleteMany("shows", filter);
  },

  /**
   * Count Shows matching filter (countDocuments)
   */
  async count(filter: Partial<Show> = {}): Promise<number> {
    const result = await magically.data.count("shows", filter);
    return result.count;
  }
};

// Export both singular and plural for convenience
export const Show = Shows;