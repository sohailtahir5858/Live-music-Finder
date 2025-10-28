/**
 * Auto-generated entity for Ad
 * Generated from magically/schemas/Ad.json
 * Collection: ads
 * @entity Ad
 * @import { Ad, Ads } from '../magically/entities/Ad'
 * @collection ads
 * @description Ad entity with full CRUD operations and TypeScript types
 * 
 * @type
 * interface Ad {
 *   title: string
 *   imageUrl: string
 *   clickUrl: string
 *   active: boolean
 *   startDate?: string
 *   endDate?: string
 *   impressions?: number
 *   clicks?: number
 *   city?: "Kelowna" | "Nelson" | "Both"
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
 * - AdCreateInput omits: _id, creator, createdAt, updatedAt
 * - AdUpdateInput is Partial<Ad> excluding: _id, creator, createdAt
 * - Protected collections: users, files (use dedicated userProfiles instead)
 */

import magically from "magically-sdk";

export interface Ad {
  /** Ad title/name for identification */
  title: string;
  /** Image URL for the ad */
  imageUrl: string;
  /** URL to open when ad is clicked */
  clickUrl: string;
  /** Whether the ad is currently active */
  active: boolean;
  /** When the ad campaign starts */
  startDate?: string;
  /** When the ad campaign ends */
  endDate?: string;
  /** Number of times ad was displayed */
  impressions?: number;
  /** Number of times ad was clicked */
  clicks?: number;
  /** Which city to show the ad in */
  city?: "Kelowna" | "Nelson" | "Both";
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

export interface AdCreateInput extends Omit<Ad, '_id' | 'creator' | 'createdAt' | 'updatedAt'> {
  isPublic?: boolean; // Optional - defaults to false if not provided
}
export interface AdUpdateInput extends Partial<Omit<Ad, '_id' | 'creator' | 'createdAt'>> {}

export const Ads = {
  /**
   * Create a new Ad (insertOne)
   */
  async save(data: AdCreateInput, options: { upsert?: boolean } = {}): Promise<Ad> {
    return magically.data.insert<Ad>("ads", data, options);
  },

  /**
   * Create a new Ad (insertOne)
   */
  async create(data: AdCreateInput, options: {  } = {}): Promise<Ad> {
    return magically.data.insert<Ad>("ads", data, options);
  },

  /**
   * Upsert Ad - update if exists, create if not
   */
  async upsert(filter: Partial<Ad>, data: AdCreateInput): Promise<{ data: Ad; upserted: boolean }> {
    return magically.data.upsert<Ad>("ads", filter, data);
  },

  /**
   * Find Ad by ID (findOne by _id)
   * Automatically includes public items to support unauthenticated access
   */
  async findById(id: string): Promise<Ad | null> {
    const result = await magically.data.query<Ad>("ads", { 
      _id: id,
      isPublic: true 
    });
    return result.data[0] || null;
  },

  /**
   * Query Ads with filters and options (find)
   */
  async query(
    filter: Partial<Ad> = {},
    options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}
  ): Promise<{ data: Ad[]; total: number }> {
    return magically.data.query<Ad>("ads", filter, options);
  },

  /**
   * List all Ads with pagination
   */
  async list(options: { limit?: number; skip?: number; sort?: any; populate?: string[] } = {}): Promise<{ data: Ad[]; total: number }> {
    return magically.data.query<Ad>("ads", {}, options);
  },

  /**
   * Update Ad by ID (updateOne)
   */
  async update(id: string, data: AdUpdateInput): Promise<Ad> {
    return magically.data.update<Ad>("ads", { _id: id }, data);
  },

  /**
   * Update multiple Ads matching filter (updateMany)
   */
  async updateMany(filter: Partial<Ad>, data: AdUpdateInput): Promise<{ matchedCount: number; modifiedCount: number }> {
    return magically.data.updateMany<Ad>("ads", filter, data);
  },

  /**
   * Delete Ad by ID (deleteOne by _id)
   */
  async delete(id: string): Promise<boolean> {
    const result = await magically.data.deleteOne("ads", { _id: id });
    return result.deletedCount > 0;
  },

  /**
   * Delete one Ad matching filter (deleteOne)
   */
  async deleteOne(filter: Partial<Ad>): Promise<{ deletedCount: number }> {
    return magically.data.deleteOne("ads", filter);
  },

  /**
   * Delete multiple Ads matching filter (deleteMany)
   */
  async deleteMany(filter: Partial<Ad>): Promise<{ deletedCount: number }> {
    return magically.data.deleteMany("ads", filter);
  },

  /**
   * Count Ads matching filter (countDocuments)
   */
  async count(filter: Partial<Ad> = {}): Promise<number> {
    const result = await magically.data.count("ads", filter);
    return result.count;
  }
};

// Export both singular and plural for convenience
export const Ad = Ads;