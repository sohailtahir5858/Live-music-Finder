import { Show } from "../magically/entities/Show";

/**
 * Service for fetching events from WordPress REST API
 */

// HTML entity decoder and text normalizer
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8230;/g, "…")
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\u00A0/g, " ") // Non-breaking space to regular space
    .replace(/\u2009/g, " ") // Thin space to regular space
    .replace(/\u2002/g, " ") // En space to regular space
    .replace(/\u2003/g, " ") // Em space to regular space
    .trim();
}

// WordPress API interfaces
interface WordPressImage {
  url: string;
  id: number;
  extension: string;
  width: number;
  height: number;
  filesize: number;
  sizes: {
    medium?: {
      width: number;
      height: number;
      "mime-type": string;
      filesize: number;
      url: string;
    };
    thumbnail?: {
      width: number;
      height: number;
      "mime-type": string;
      filesize: number;
      url: string;
    };
    [key: string]: any;
  };
  "et-pb-image--responsive--phone"?: {
    url: string;
    width: number;
    height: number;
  };
}

export interface WordPressCategory {
  name: string;
  slug: string;
  term_group: number;
  term_taxonomy_id: number;
  taxonomy: string;
  description: string;
  parent: number;
  count: number;
  filter: string;
  id: number;
  urls: {
    self: string;
    collection: string;
  };
}

export interface WordPressVenue {
  id: number;
  author: string;
  status: string;
  date: string;
  date_utc: string;
  modified: string;
  modified_utc: string;
  url: string;
  venue: string;
  slug: string;
  address: string;
  city: string;
  country: string;
  province: string;
  zip: string;
  phone: string;
  website: string;
  stateprovince: string;
  show_map: boolean;
  show_map_link: boolean;
  global_id: string;
  global_id_lineage: string[];
}

interface WordPressEvent {
  id: number;
  global_id: string;
  global_id_lineage: string[];
  author: string;
  status: string;
  date: string;
  date_utc: string;
  modified: string;
  modified_utc: string;
  url: string;
  rest_url: string;
  title: string;
  description: string;
  excerpt: string;
  slug: string;
  image?: WordPressImage;
  all_day: boolean;
  start_date: string;
  start_date_details: {
    year: string;
    month: string;
    day: string;
    hour: string;
    minutes: string;
    seconds: string;
  };
  end_date: string;
  end_date_details: {
    year: string;
    month: string;
    day: string;
    hour: string;
    minutes: string;
    seconds: string;
  };
  utc_start_date: string;
  utc_start_date_details: {
    year: string;
    month: string;
    day: string;
    hour: string;
    minutes: string;
    seconds: string;
  };
  utc_end_date: string;
  utc_end_date_details: {
    year: string;
    month: string;
    day: string;
    hour: string;
    minutes: string;
    seconds: string;
  };
  timezone: string;
  timezone_abbr: string;
  cost: string;
  cost_details: {
    currency_symbol: string;
    currency_code: string;
    currency_position: string;
    values: string[];
  };
  website: string;
  show_map: boolean;
  show_map_link: boolean;
  hide_from_listings: boolean;
  sticky: boolean;
  featured: boolean;
  categories: WordPressCategory[];
  tags: any[];
  venue?: WordPressVenue;
  organizer: any[];
  custom_fields: any[];
  is_virtual: boolean;
  virtual_url: string | null;
  virtual_video_source: string;
}

interface WordPressApiResponse {
  events: WordPressEvent[];
  rest_url: string;
  total: number;
  total_pages: number;
  [key: string]: any;
}

interface WordPressCategoryResponse {
  categories: WordPressCategory[];
  rest_url: string;
  total: number;
  total_pages: number;
  next_rest_url?: string;
  [key: string]: any;
}

interface WordPressVenueResponse {
  venues: WordPressVenue[];
  rest_url: string;
  total: number;
  total_pages: number;
  next_rest_url?: string;
  [key: string]: any;
}
interface FinalEventsI {
  events: Show[];
  total: number;
  totalPages: number;
  rest_url: string;
  next_rest_url?: string;
}
export const fetchEvents = async (
  city: string,
  page: number = 1,
  options?: {
    categoryIds?: string[];
    timeFilter?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<FinalEventsI> => {
  const baseUrl =
    city.toLowerCase() === "nelson"
      ? "https://livemusicnelson.ca/wp-json/tribe/events/v1/events/"
      : "https://livemusickelowna.ca/wp-json/tribe/events/v1/events/";

  // Format dates properly for WordPress API (using local time, not UTC)
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const now = new Date();
  const twoMonthsFromNow = new Date(now);

  twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
  let startDate = formatLocalDateTime(now); // Current date and time in YYYY-MM-DD HH:MM:SS format (local time)
  let endDate = formatLocalDateTime(twoMonthsFromNow); // 2 months from now in YYYY-MM-DD HH:MM:SS format (local time)
  console.log(startDate, endDate);
  if (options?.dateFrom) {
    // If dateFrom is just YYYY-MM-DD, convert to YYYY-MM-DD 00:00:00
    startDate = options.dateFrom.includes(":")
      ? options.dateFrom
      : `${options.dateFrom} 00:00:00`;
  }

  if (options?.dateTo) {
    // If dateTo is just YYYY-MM-DD, convert to YYYY-MM-DD 23:59:59
    endDate = options.dateTo.includes(":")
      ? options.dateTo
      : `${options.dateTo} 23:59:59`;
  }

  let url = `${baseUrl}?page=${page}&per_page=10&start_date=${encodeURIComponent(
    startDate
  )}&end_date=${encodeURIComponent(endDate)}&status=publish`;

  // Add category filters if provided
  if (options?.categoryIds && options.categoryIds.length > 0) {
    options.categoryIds.forEach((catId) => {
      url += `&categories[]=${catId}`;
    });
  }

  try {
    const response = await fetch(url);
    const data: WordPressApiResponse = await response.json();

    let events = mapWordPressEventsToAppFormat(data);

    // Apply time filter in memory if provided
    if (options?.timeFilter) {
      events = filterEventsByTime(events, options.timeFilter);
    }

    return {
      events: events,
      total: data.total,
      totalPages: data.total_pages,
      rest_url: data.rest_url,
      next_rest_url: data.next_rest_url,
    };
  } catch (error) {
    console.error("Error fetching events:", error);
    return {
      events: [],
      total: 0,
      totalPages: 0,
      rest_url: "",
    };
  }
};

// Helper function to filter events by time of day
function filterEventsByTime(events: Show[], timeFilter: string): Show[] {
  const getHourFromTime = (timeStr: string): number => {
    const match = timeStr.match(/(\d+):/);
    return match ? parseInt(match[1], 10) : 0;
  };

  return events.filter((event) => {
    const hour = getHourFromTime(event.time);

    switch (timeFilter) {
      case "morning":
        return hour >= 6 && hour < 12;
      case "afternoon":
        return hour >= 12 && hour < 17;
      case "evening":
        return hour >= 17 && hour < 21;
      case "night":
        return hour >= 21 || hour < 6;
      case "all-day":
      default:
        return true;
    }
  });
}

export const fetchGenres = async (
  city: string
): Promise<WordPressCategory[]> => {
  const baseUrl =
    city.toLowerCase() === "nelson"
      ? "https://livemusicnelson.ca/wp-json/tribe/events/v1/categories/"
      : "https://livemusickelowna.ca/wp-json/tribe/events/v1/categories/";

  const allCategories: WordPressCategory[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const url = `${baseUrl}?page=${currentPage}&per_page=50&status=publish`;
      console.log(`🚀 ~ fetchGenres ~ Fetching page ${currentPage}:`, url);

      const response = await fetch(url);
      const data: WordPressCategoryResponse = await response.json();

      if (data.categories && data.categories.length > 0) {
        allCategories.push(...data.categories);
        console.log(
          `🚀 ~ fetchGenres ~ Page ${currentPage}: ${data.categories.length} categories`
        );

        // Check if there's a next page
        hasNextPage =
          data.next_rest_url !== undefined && data.next_rest_url !== null;
        currentPage++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(
      `🚀 ~ fetchGenres ~ Total categories fetched: ${allCategories.length}`
    );
    return allCategories;
  } catch (error) {
    console.error("Error fetching genres:", error);
    return [];
  }
};

export const fetchVenues = async (city: string): Promise<WordPressVenue[]> => {
  const baseUrl =
    city.toLowerCase() === "nelson"
      ? "https://livemusicnelson.ca/wp-json/tribe/events/v1/venues/"
      : "https://livemusickelowna.ca/wp-json/tribe/events/v1/venues/";

  const allVenues: WordPressVenue[] = [];
  let currentPage = 1;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const url = `${baseUrl}?page=${currentPage}&per_page=50&status=publish`;
      console.log(`🚀 ~ fetchVenues ~ Fetching page ${currentPage}:`, url);

      const response = await fetch(url);
      const data: WordPressVenueResponse = await response.json();

      if (data.venues && data.venues.length > 0) {
        allVenues.push(...data.venues);
        console.log(
          `🚀 ~ fetchVenues ~ Page ${currentPage}: ${data.venues.length} venues`
        );

        // Check if there's a next page
        hasNextPage =
          data.next_rest_url !== undefined && data.next_rest_url !== null;
        currentPage++;
      } else {
        hasNextPage = false;
      }
    }

    console.log(`🚀 ~ fetchVenues ~ Total venues fetched: ${allVenues.length}`);
    // Sort venues alphabetically by venue name
    allVenues.sort((a, b) => a.venue.localeCompare(b.venue));
    return allVenues;
  } catch (error) {
    console.error("Error fetching venues:", error);
    return [];
  }
};

export function mapWordPressEventsToAppFormat(
  response: WordPressApiResponse
): Show[] {
  if (!response.events) return [];

  return response.events.map((event: WordPressEvent) => {
    // combine address parts
    const venueAddressParts = [
      event.venue?.address,
      event.venue?.city,
      event.venue?.province,
      event.venue?.zip,
    ].filter(Boolean);

    // extract time from start_date
    const startDate = new Date(event.start_date.replace(" ", "T"));
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    // Use highest resolution image available, fallback to medium, then main url
    const phoneImage = event.image?.["et-pb-image--responsive--phone"];
    const imageUrl =
      (phoneImage && phoneImage.url) || event.image?.url || undefined;

    // derive width/height from the same source if available
    const width =
      phoneImage?.width ??
      event.image?.sizes?.medium?.width ??
      event.image?.width;
    const height =
      phoneImage?.height ??
      event.image?.sizes?.medium?.height ??
      event.image?.height;

    return {
      _id: event.id.toString(),
      title: decodeHtmlEntities(event.title),
      artist: decodeHtmlEntities(event.title), // WordPress doesn't provide separate artist name
      venue: decodeHtmlEntities(event.venue?.venue || "TBA"),
      venueAddress: venueAddressParts.join(", "),
      city: (event.venue?.city === "Nelson" ? "Nelson" : "Kelowna") as
        | "Kelowna"
        | "Nelson",
      date: new Date(event.start_date.replace(" ", "T"))
        .toISOString()
        .split("T")[0],
      time: formattedTime,
      genre: event.categories?.map((c: WordPressCategory) => c.name) || [
        "General",
      ],
      description: event.description
        ? decodeHtmlEntities(event.description.replace(/<[^>]+>/g, "").trim())
        : "",
      imageUrl: imageUrl!,
      imageHeight: height!,
      imageWidth: width!,
      price: event.cost && event.cost !== "Free" ? `$${event.cost}` : "Free",
      capacity: undefined, // not in WP data
      popularity: 4 + Math.random() * 1, // mock rating 4–5
      isPublic: event.status === "publish",
      creator: event.author?.toString() || "system",
      createdAt: new Date(event.date_utc),
      updatedAt: new Date(event.modified_utc),
      __v: 0,
    };
  });
}
