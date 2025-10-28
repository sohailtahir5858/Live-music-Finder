/**
 * @function sync-kelowna-shows
 * @description Scrapes livemusickelowna.ca and syncs show data to the database
 * @schedule Daily at 6 AM PST (runs automatically via cron)
 * @manual Can also be triggered manually by calling the function
 */

interface Env {
  MAGICALLY_PROJECT_ID: string;
  MAGICALLY_API_BASE_URL: string;
  MAGICALLY_API_KEY: string;
}

interface Show {
  title: string;
  artist: string;
  venue: string;
  venueAddress: string;
  city: string;
  date: string;
  time: string;
  genre: string[];
  description: string;
  imageUrl?: string;
  sourceUrl?: string;
  _id?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      console.log('🎵 Starting Kelowna show sync...');

      // Fetch the events page
      const eventsUrl = 'https://livemusickelowna.ca/events/';
      const response = await fetch(eventsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const html = await response.text();
      console.log('✅ Fetched events page');

      // Parse the HTML to extract events from all pages
      const allShows = await parseAllKelownaEvents();
      console.log(`📊 Found ${allShows.length} total shows from all pages`);
      
      // Filter out past shows - only keep shows from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shows = allShows.filter(show => {
        const showDate = new Date(show.date);
        return showDate >= today;
      });
      console.log(`✅ Filtered to ${shows.length} future shows (removed ${allShows.length - shows.length} past shows)`);


      // Sync to database
      const syncResults = await syncShowsToDatabase(env, shows);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Kelowna shows synced successfully',
          stats: syncResults,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('❌ Error syncing Kelowna shows:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },

  // Cron trigger - runs daily at 6 AM PST
  async scheduled(event: any, env: Env, ctx: any): Promise<void> {
    console.log('⏰ Cron triggered - syncing Kelowna shows');
    
    // Create a fake request to trigger the main fetch handler
    const request = new Request('https://sync-kelowna-shows.worker', {
      method: 'POST',
    });
    
    // Execute the sync
    await this.fetch(request, env);
  },
};

/**
 * Parse HTML from livemusickelowna.ca and extract show data from all pages
 */
async function parseAllKelownaEvents(): Promise<Show[]> {
  const allShows: Show[] = [];
  const baseUrl = 'https://livemusickelowna.ca/events/';
  const maxPages = 10; // Limit to prevent infinite loops

  try {
    // Start with page 1
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage && currentPage <= maxPages) {
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}page/${currentPage}/`;
      console.log(`🔍 Scraping page ${currentPage}: ${pageUrl}`);

      try {
        const response = await fetch(pageUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch page ${currentPage}: ${response.status}`);
          break;
        }

        const html = await response.text();
        const pageShows = await parseKelownaEventsFromPage(html);

        if (pageShows.length === 0) {
          console.log(`📄 Page ${currentPage} has no events, stopping pagination`);
          break;
        }

        console.log(`✅ Found ${pageShows.length} shows on page ${currentPage}`);
        allShows.push(...pageShows);

        // Check if there's a next page
        hasNextPage = hasNextPageLink(html);
        currentPage++;

        // Add a small delay to be respectful to the server
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error scraping page ${currentPage}:`, error);
        break;
      }
    }

    console.log(`🎯 Total shows scraped from all pages: ${allShows.length}`);

    // Remove duplicates based on title, venue, and date
    const uniqueShows = removeDuplicateShows(allShows);
    console.log(`🧹 Removed ${allShows.length - uniqueShows.length} duplicate shows`);

    // Second pass: Fetch individual pages for shows with "General" genre to get Event Categories
    const showsNeedingGenres = uniqueShows.filter(s =>
      s.genre.length === 1 && s.genre[0] === 'General' &&
      s.sourceUrl && s.sourceUrl.includes('/event/')
    );

    if (showsNeedingGenres.length > 0) {
      console.log(`📋 Fetching genres for ${showsNeedingGenres.length} events...`);

      // Process in batches to avoid overwhelming the server
      const batchSize = 10;
      for (let i = 0; i < showsNeedingGenres.length; i += batchSize) {
        const batch = showsNeedingGenres.slice(i, i + batchSize);
        console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(showsNeedingGenres.length/batchSize)}`);

        const promises = batch.map(async (show) => {
          try {
            const response = await fetch(show.sourceUrl!);
            if (response.ok) {
              const eventHtml = await response.text();
              const extractedGenres = extractGenresFromEventPage(eventHtml);
              if (extractedGenres && extractedGenres.length > 0 && extractedGenres[0] !== 'General') {
                show.genre = extractedGenres;
                console.log(`✅ Updated "${show.title}" genre to: ${show.genre.join(', ')}`);
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch event page for: ${show.title}`);
          }
        });

        await Promise.all(promises);

        // Small delay between batches
        if (i + batchSize < showsNeedingGenres.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

  } catch (error) {
    console.error('Error in parseAllKelownaEvents:', error);
  }

  return allShows;
}

/**
 * Check if the page has a "next page" link
 */
function hasNextPageLink(html: string): boolean {
  // Look for pagination links
  const nextPagePatterns = [
    /<link[^>]*rel="next"[^>]*href="[^"]*\/page\/\d+\/?"[^>]*>/i,
    /<a[^>]*href="[^"]*\/page\/\d+\/?"[^>]*>Next|»|&raquo;/i,
    /<link[^>]*rel="next"/i,
    /class="[^"]*next[^"]*"/i
  ];

  return nextPagePatterns.some(pattern => pattern.test(html));
}

/**
 * Remove duplicate shows based on title, venue, and date
 */
function removeDuplicateShows(shows: Show[]): Show[] {
  const seen = new Set<string>();
  return shows.filter(show => {
    const key = `${show.title}-${show.venue}-${show.date}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Parse HTML from livemusickelowna.ca and extract show data from a single page
 */
async function parseKelownaEventsFromPage(html: string): Promise<Show[]> {
  const shows: Show[] = [];

  try {
    // livemusickelowna.ca uses WordPress event calendar
    // Look for event items in the calendar list

    // Try multiple patterns for WordPress event calendars
    const patterns = [
      // The Events Calendar plugin (tribe-events)
      /<article[^>]*class="[^"]*tribe-events-calendar-list__event-row[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class="[^"]*tribe-common-g-row[^"]*"[^>]*data-event-id="[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      // Generic event patterns
      /<article[^>]*class="[^"]*(?:event|upcoming)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    ];

    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];

      if (matches.length > 0) {
        console.log(`✅ Found ${matches.length} events with pattern`);

        for (const match of matches) {
          const eventHtml = match[1] || match[0];

          try {
            const show = extractShowData(eventHtml, html);
            if (show && show.title && show.date) {
              shows.push(show);
            }
          } catch (err) {
            console.warn('Failed to parse individual event:', err);
          }
        }

        // If we found shows, break
        if (shows.length > 0) break;
      }
    }

    // If no shows found with patterns, try extracting event URLs and fetching individual pages
    if (shows.length === 0) {
      console.log('⚠️ No shows found with HTML patterns, extracting event URLs...');
      const eventShows = await parseEventLinks(html);
      shows.push(...eventShows);
    }

  } catch (error) {
    console.error('Error parsing events from page:', error);
  }

  return shows;
}

/**
 * Parse event links and fetch individual event pages
 */
async function parseEventLinks(html: string): Promise<Show[]> {
  const shows: Show[] = [];
  
  // Look for links to individual event pages
  const eventLinkPattern = /href="(https:\/\/livemusickelowna\.ca\/event\/[^"]+)"/gi;
  const links = [...html.matchAll(eventLinkPattern)];
  
  console.log(`Found ${links.length} event page links`);
  
  // Fetch up to 20 event pages
  const uniqueLinks = [...new Set(links.map(m => m[1]))].slice(0, 20);
  
  for (const url of uniqueLinks) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const eventHtml = await response.text();
        const show = extractShowDataFromEventPage(eventHtml);
        if (show && show.title && show.date) {
          shows.push(show);
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch event page: ${url}`);
    }
  }
  
  return shows;
}

/**
 * Extract show data from event HTML block
 */
function extractShowData(eventHtml: string, fullHtml?: string): Show | null {
  try {
    // Extract event URL for detailed page scraping
    let eventUrl = '';
    const urlPatterns = [
      /<a[^>]*class="[^"]*tribe-events-calendar-list__event-title-link[^"]*"[^>]*href="([^"]+)"/i,
      /<a[^>]*href="(https:\/\/livemusickelowna\.ca\/event\/[^"]+)"/i,
    ];
    
    for (const pattern of urlPatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        eventUrl = match[1];
        break;
      }
    }

    // Extract title - try multiple patterns
    let title = '';
    const titlePatterns = [
      /<h3[^>]*class="[^"]*tribe-events-calendar-list__event-title[^"]*"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i,
      /<a[^>]*class="[^"]*tribe-events-calendar-list__event-title-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
      /<h3[^>]*class="[^"]*(?:event-title|entry-title)[^"]*"[^>]*>([\s\S]*?)<\/h3>/i,
      /<a[^>]*class="[^"]*(?:event-url|tribe-event-url)[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
    ];
    
    for (const pattern of titlePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        title = stripHtml(match[1]);
        break;
      }
    }

    // Extract date - try multiple patterns
    let dateStr = '';
    const datePatterns = [
      /<time[^>]*datetime="([^"]+)"/i,
      /class="[^"]*tribe-event-date-start[^"]*"[^>]*datetime="([^"]+)"/i,
      /class="[^"]*tribe-events-calendar-list__event-datetime[^"]*"[^>]*>([^<]+)</i,
    ];
    
    for (const pattern of datePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        dateStr = match[1];
        break;
      }
    }

    // Extract time
    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i,
      /@\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i,
    ];
    let time = '';
    for (const pattern of timePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        time = match[1];
        break;
      }
    }

    // Extract venue - try multiple patterns
    let venue = '';
    const venuePatterns = [
      /class="[^"]*tribe-events-calendar-list__event-venue-title[^"]*"[^>]*>([^<]+)</i,
      /class="[^"]*tribe-event-venue[^"]*"[^>]*>([^<]+)</i,
      /<span[^>]*class="[^"]*venue[^"]*"[^>]*>([^<]+)</i,
    ];
    
    for (const pattern of venuePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        venue = stripHtml(match[1]);
        break;
      }
    }

    // Extract genre from categories
    const genres: string[] = [];
    
    // Pattern 1: Event Category section (dt/dd structure) - PRIORITY
    const eventCategoryMatch = eventHtml.match(/<dt[^>]*>Event Category[^<]*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i);
    if (eventCategoryMatch) {
      const categoryHtml = eventCategoryMatch[1];
      const categoryLinks = categoryHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      genres.push(...Array.from(categoryLinks).map(m => stripHtml(m[1])));
    }
    
    // Pattern 2: Category container
    if (genres.length === 0) {
      const categoryContainerMatch = eventHtml.match(/class="[^"]*tribe-events-event-categories[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|ul)>/i);
      if (categoryContainerMatch) {
        const categoryText = stripHtml(categoryContainerMatch[1]);
        const cats = categoryText.split(/[,\/]/).map(c => c.trim()).filter(c => c.length > 0);
        genres.push(...cats);
      }
    }
    
    // Pattern 3: Individual category links
    if (genres.length === 0) {
      const categoryLinkPattern = /<a[^>]*rel="category tag"[^>]*>([^<]+)<\/a>/gi;
      const matches = [...eventHtml.matchAll(categoryLinkPattern)];
      for (const match of matches) {
        const categoryText = stripHtml(match[1]);
        if (categoryText.length > 0) {
          genres.push(categoryText);
        }
      }
    }
    
    // Filter out non-genre terms
    const filterTerms = ['event', 'events', 'calendar', 'venue', 'upcoming'];
    const filteredGenres = genres.filter(g => 
      !filterTerms.some(term => g.toLowerCase().includes(term))
    );

    // Extract image
    const imageMatch = eventHtml.match(/<img[^>]*src="([^"]+)"/i);
    const imageUrl = imageMatch && !imageMatch[1].includes('placeholder') ? imageMatch[1] : undefined;

    // Extract description
    const descPatterns = [
      /class="[^"]*tribe-events-calendar-list__event-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ];
    let description = '';
    for (const pattern of descPatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        description = stripHtml(match[1]).substring(0, 500);
        break;
      }
    }

    // If we have an event URL and no genres found, return minimal data with URL
    // so we can fetch the full page later
    if (eventUrl && filteredGenres.length === 0) {
      console.log(`⚠️ No genres found in listing for "${title}", need to fetch: ${eventUrl}`);
    }
    
    if (!title || !dateStr) {
    console.log(`⚠️ Returning null - missing data: title="${title}", dateStr="${dateStr}"`);
      return null;
        }

    return {
      title,
      artist: title,
      venue: venue || 'TBA',
      venueAddress: '',
      city: 'Kelowna',
      date: formatDate(dateStr),
      time: time || 'TBA',
      genre: filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ['General'],
      description: description || `${title} at ${venue || 'venue TBA'}`,
      imageUrl,
      sourceUrl: eventUrl || 'https://livemusickelowna.ca',
    };
  } catch (error) {
    console.error('Error extracting show data:', error);
    return null;
  }
}

/**
 * Extract ONLY genres from individual event page (optimized for second pass)
 */
function extractGenresFromEventPage(html: string): string[] {
  const genres: string[] = [];
  
  try {
    // Broad search: Find "Event Categor" and extract next 500 chars
    const broadMatch = html.match(/Event Categor(?:y|ies)[^<]*([\s\S]{0,500})/i);
    if (broadMatch) {
      const snippet = broadMatch[0];
      
      // Extract all <a> tags from the snippet
      const links = snippet.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      const linkGenres = Array.from(links).map(m => stripHtml(m[1]));
      
      if (linkGenres.length > 0) {
        genres.push(...linkGenres);
      } else {
        // Try to extract plain text after colon
        const textMatch = snippet.match(/Event Categor(?:y|ies)[:\s]*([^<]+)/i);
        if (textMatch) {
          const plainText = stripHtml(textMatch[1]).trim();
          if (plainText && plainText.length < 200) {
            const parsedGenres = plainText.split(',').map(g => g.trim()).filter(g => g && g.length > 1);
            genres.push(...parsedGenres);
          }
        }
      }
    }
    
    // Fallback: rel="category tag"
    if (genres.length === 0) {
      const genreMatches = html.matchAll(/<a[^>]*rel="category tag"[^>]*>([^<]+)<\/a>/gi);
      genres.push(...Array.from(genreMatches).map(m => stripHtml(m[1])));
    }
    
    // Filter out non-genre terms
    const filterTerms = ['event', 'events', 'calendar', 'venue', 'upcoming'];
    const filteredGenres = genres.filter(g => 
      !filterTerms.some(term => g.toLowerCase().includes(term))
    );
    
    return filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ['General'];
  } catch (error) {
    console.error('Error extracting genres:', error);
    return ['General'];
  }
}

/**
 * Extract show data from individual event page
 */
function extractShowDataFromEventPage(html: string): Show | null {
  try {
    // Extract title from page
    const titleMatch = html.match(/<h1[^>]*class="[^"]*(?:tribe-events-single-event-title|entry-title)[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : '';

    // Extract date
    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
    const dateStr = dateMatch ? dateMatch[1] : '';

    // Extract time
    const timeMatch = html.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    const time = timeMatch ? timeMatch[1] : 'TBA';

    // Extract venue
    const venueMatch = html.match(/class="[^"]*tribe-venue[^"]*"[^>]*>([^<]+)</i);
    const venue = venueMatch ? stripHtml(venueMatch[1]) : 'TBA';

    // Extract genres from Event Category section
    const genres: string[] = [];
    
    // Broad search: Find "Event Categor" and extract next 500 chars
    const broadMatch = html.match(/Event Categor(?:y|ies)[^<]*([\s\S]{0,500})/i);
    if (broadMatch) {
      const snippet = broadMatch[0];
      console.log(`✅ Found Event Category snippet: ${snippet.substring(0, 200)}`);
      
      // Extract all <a> tags from the snippet
      const links = snippet.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      const linkGenres = Array.from(links).map(m => stripHtml(m[1]));
      
      if (linkGenres.length > 0) {
        genres.push(...linkGenres);
        console.log(`✅ Extracted ${linkGenres.length} genres from links: ${linkGenres.join(', ')}`);
      } else {
        // Try to extract plain text after colon
        const textMatch = snippet.match(/Event Categor(?:y|ies)[:\s]*([^<]+)/i);
        if (textMatch) {
          const plainText = stripHtml(textMatch[1]).trim();
          if (plainText && plainText.length < 200) { // Sanity check
            const parsedGenres = plainText.split(',').map(g => g.trim()).filter(g => g && g.length > 1);
            genres.push(...parsedGenres);
            console.log(`✅ Extracted ${parsedGenres.length} genres from text: ${parsedGenres.join(', ')}`);
          }
        }
      }
    } else {
      console.log('⚠️ No Event Category text found anywhere in HTML');
    }
    
    // Pattern 2: rel="category tag" (fallback)
    if (genres.length === 0) {
      const genreMatches = html.matchAll(/<a[^>]*rel="category tag"[^>]*>([^<]+)<\/a>/gi);
      genres.push(...Array.from(genreMatches).map(m => stripHtml(m[1])));
    }
    
    // Filter out non-genre terms
    const filterTerms = ['event', 'events', 'calendar', 'venue', 'upcoming'];
    const filteredGenres = genres.filter(g => 
      !filterTerms.some(term => g.toLowerCase().includes(term))
    );

    // Extract description
    const descMatch = html.match(/class="[^"]*tribe-events-single-event-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const description = descMatch ? stripHtml(descMatch[1]).substring(0, 500) : '';

    // Extract image
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const imageUrl = imageMatch ? imageMatch[1] : undefined;

    if (!title || !dateStr) {
      return null;
    }

    return {
      title,
      artist: title,
      venue,
      venueAddress: '',
      city: 'Kelowna',
      date: formatDate(dateStr),
      time,
      genre: filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ['General'],
      description: description || `${title} at ${venue}`,
      imageUrl,
      sourceUrl: 'https://livemusickelowna.ca',
    };
  } catch (error) {
    console.error('Error extracting from event page:', error);
    return null;
  }
}

/**
 * Strip HTML tags and decode all HTML entities
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    // Common named HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&ndash;/g, '-')
    .replace(/&mdash;/g, '-')
    .replace(/&hellip;/g, '...')
    .replace(/&copy;/g, '(c)')
    .replace(/&reg;/g, '(R)')
    .replace(/&trade;/g, '(TM)')
    .replace(/&deg;/g, 'deg')
    // Numeric HTML entities (&#NNNN; format)
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10)))
    // Hex HTML entities (&#xHHHH; format)
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

/**
 * Format date string to YYYY-MM-DD
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Sync shows to database (deduplicate and update)
 */
async function syncShowsToDatabase(env: Env, shows: Show[]): Promise<any> {
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const show of shows) {
    try {
      // Check if show already exists (by title, venue, and date)
      const queryResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MAGICALLY_API_KEY}`,
          'X-Project-ID': env.MAGICALLY_PROJECT_ID,
        },
        body: JSON.stringify({
          collection: 'shows',
          query: {
            title: show.title,
            venue: show.venue,
            date: show.date,
            city: 'Kelowna',
          },
        }),
      });

      if (!queryResponse.ok) {
        throw new Error(`Query failed: ${queryResponse.status}`);
      }

      const existing = await queryResponse.json();

      if (existing.data && existing.data.length > 0) {
        // Update existing show
        const updateResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.MAGICALLY_API_KEY}`,
            'X-Project-ID': env.MAGICALLY_PROJECT_ID,
          },
          body: JSON.stringify({
            collection: 'shows',
            filter: { _id: existing.data[0]._id },
            update: show,
          }),
        });

        if (!updateResponse.ok) {
          throw new Error(`Update failed: ${updateResponse.status}`);
        }

        updated++;
      } else {
        // Add new show
        const insertResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/insert`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.MAGICALLY_API_KEY}`,
            'X-Project-ID': env.MAGICALLY_PROJECT_ID,
          },
          body: JSON.stringify({
            collection: 'shows',
            document: {
              ...show,
              isPublic: true, // Shows are public data
            },
          }),
        });

        if (!insertResponse.ok) {
          throw new Error(`Insert failed: ${insertResponse.status}`);
        }

        added++;
      }
    } catch (error) {
      console.error('Error syncing show:', show.title, error);
      skipped++;
    }
  }

  return { added, updated, skipped, total: shows.length };
}