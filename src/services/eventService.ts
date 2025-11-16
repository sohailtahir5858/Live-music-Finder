import { Show } from "../magically/entities/Show";
import { formatDate, TIME_FILTERS } from "../utils/filterHelpers";

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
    venueIds?: string[];
  }
): Promise<FinalEventsI> => {
  console.log(".......", options);
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

  // IMPORTANT: We always send the FULL 24-hour day to the API
  // Time filtering (morning/afternoon/evening/night) happens CLIENT-SIDE after fetching

  // Store the selected time filter for local filtering after API response
  const selectedTimeFilter = options?.timeFilter;
  console.log("🚀 ~ fetchEvents ~ selectedTimeFilter:", selectedTimeFilter)
  if (selectedTimeFilter) {
    const timeFilter = TIME_FILTERS.find(
      (tf) => tf.value === options.timeFilter
    );
    if (timeFilter && timeFilter.dateRange) {
      const { from, to } = timeFilter.dateRange;
      startDate = formatDate(new Date(from));
      endDate = formatDate(new Date(to)).split("T")[0] + "T23:59:59";
    }
  }

  let url = `${baseUrl}?page=${page}&per_page=10&start_date=${encodeURIComponent(
    startDate
  )}&end_date=${encodeURIComponent(endDate)}&strict_dates=true&status=publish`;
  // Add category filters if provided
  if (options?.categoryIds && options.categoryIds.length > 0) {
    options.categoryIds.forEach((catId) => {
      url += `&categories[]=${catId}`;
    });
  }
  // Add venue filters if provided
  if (options?.venueIds && options.venueIds.length > 0) {
    options.venueIds.forEach((venueId) => {
      url += `&venue[]=${venueId}`;
    });
  }
  console.log(url, "url");
  try {
    const response = await fetch(url);
    const data: WordPressApiResponse = await response.json();

    let events = mapWordPressEventsToAppFormat(data);
    console.log(`✅ Fetched ${events.length} events from API (full day)`);

    // Apply time filter locally if user selected a specific time of day
    if (selectedTimeFilter) {
      if (selectedTimeFilter === "all-day") {
        console.log(
          `📋 Showing all ${events.length} events (all-day selected)`
        );
      } else {
        const beforeCount = events.length;
        events = filterEventsByTime(events, selectedTimeFilter);
        console.log(
          `🎯 Filtered to ${
            events.length
          } events for "${selectedTimeFilter}" (removed ${
            beforeCount - events.length
          })`
        );
      }
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

// Helper function to filter events by time of day (CLIENT-SIDE)
function filterEventsByTime(events: Show[], timeFilter: string): Show[] {
  const getHourFromTime = (timeStr: string): number => {
    // Match time with optional AM/PM
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (!match) {
      console.warn("⚠️ Failed to parse time:", timeStr);
      return 0;
    }

    let hour = parseInt(match[1], 10);
    const period = match[3]?.toUpperCase();

    // Convert to 24-hour format
    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    return hour;
  };

  console.log(
    `🎬 Applying "${timeFilter}" filter to ${events.length} events...`
  );

  const filtered = events.filter((event) => {
    const hour = getHourFromTime(event.time);
    let matches = false;

    switch (timeFilter) {
      case "morning":
        // 6:00 AM to 11:59 AM
        matches = hour >= 6 && hour < 12;
        break;
      case "afternoon":
        // 12:00 PM to 4:59 PM
        matches = hour >= 12 && hour < 17;
        break;
      case "evening":
        // 5:00 PM to 8:59 PM
        matches = hour >= 17 && hour < 21;
        break;
      case "night":
        // 9:00 PM to 5:59 AM
        matches = hour >= 21 || hour < 6;
        break;
      case "all-day":
      default:
        matches = true;
    }

    // Only log excluded events to reduce console noise
    if (!matches) {
      console.log(
        `  ⏭️  Skipping "${event.title}" @ ${event.time} (hour: ${hour})`
      );
    }

    return matches;
  });

  console.log(
    `✅ Filter complete: ${filtered.length}/${events.length} events match "${timeFilter}"`
  );
  return filtered;
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

    // Extract image variants for different screen sizes
    const mobileImageData =
      event.image?.sizes?.["et-pb-image--responsive--phone"];
    const hdImageData = event.image; // Main image is HD

    // Determine which image to use as primary (fallback chain: mobile → medium → main)
    const imageUrl =
      (mobileImageData && mobileImageData.url) || event.image?.url || undefined;
    const width = mobileImageData?.width ?? event.image?.width;
    const height = mobileImageData?.height ?? event.image?.height;

    // Build mobile image object if available
    const mobileImage = mobileImageData
      ? {
          url: mobileImageData.url,
          width: mobileImageData.width,
          height: mobileImageData.height,
        }
      : undefined;

    // Build HD image object if available
    const hdImage =
      hdImageData && hdImageData.url
        ? {
            url: hdImageData.url,
            width: hdImageData.width,
            height: hdImageData.height,
          }
        : undefined;

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
      mobileImage,
      hdImage,
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
