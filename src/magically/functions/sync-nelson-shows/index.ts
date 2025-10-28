/**
 * @function sync-nelson-shows
 * @description Scrapes livemusicnelson.ca and syncs show data to the database
 * @schedule Runs daily at 6 AM PST (runs automatically via cron)
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
      console.log('🎵 Starting Nelson show sync...');

      // Fetch the events page
      const eventsUrl = 'https://livemusicnelson.ca/events/';
      const response = await fetch(eventsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }

      const html = await response.text();
      console.log('✅ Fetched events page');

      // Parse the HTML to extract events
      const allShows = await parseAllNelsonEvents();
      console.log(`📊 Found ${allShows.length} total shows`);
      
      // Filter out past shows - only keep shows from today onwards
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const shows = allShows.filter((show: Show) => {
        const showDate = new Date(show.date);
        return showDate >= today;
      });
      console.log(`✅ Filtered to ${shows.length} future shows (removed ${allShows.length - shows.length} past shows)`);


      // Sync to database
      const syncResults = await syncShowsToDatabase(env, shows);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nelson shows synced successfully',
          stats: syncResults,
          timestamp: new Date().toISOString(),
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('❌ Error syncing Nelson shows:', error);
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
    console.log('⏰ Cron triggered - syncing Nelson shows');
    
    // Create a fake request to trigger the main fetch handler
    const request = new Request('https://sync-nelson-shows.worker', {
      method: 'POST',
    });
    
    // Execute the sync
    await this.fetch(request, env);
  },
};

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
 * Check if there's a next page link in the HTML
 */
function hasNextPageLink(html: string): boolean {
  const nextPagePatterns = [
    /<a[^>]*href="[^"]*\/events\/page\/\d+\/?"[^>]*class="[^"]*next[^"]*"[^>]*>/i,
    /<link[^>]*rel="next"[^>]*href="[^"]*\/events\/page\/\d+\/?"[^>]*>/i,
    /<a[^>]*href="([^"]*\/events\/page\/\d+\/?)">[^>]*next[^<]*<\/a>/i,
  ];

  return nextPagePatterns.some(pattern => pattern.test(html));
}

/**
 * Parse all Nelson events across multiple pages
 */
async function parseAllNelsonEvents(): Promise<Show[]> {
  const allShows: Show[] = [];
  let page = 1;
  const maxPages = 10; // Safety limit to prevent infinite loops

  while (page <= maxPages) {
    const pageUrl = page === 1
      ? 'https://livemusicnelson.ca/events/'
      : `https://livemusicnelson.ca/events/page/${page}/`;

    console.log(`📄 Fetching page ${page}: ${pageUrl}`);

    try {
      const response = await fetch(pageUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch page ${page}: ${response.status}`);
        break;
      }

      const html = await response.text();
      const pageShows = await parseNelsonEventsFromPage(html);

      console.log(`📊 Page ${page}: Found ${pageShows.length} shows`);

      if (pageShows.length === 0) {
        console.log(`⚠️ No shows found on page ${page}, stopping pagination`);
        break;
      }

      allShows.push(...pageShows);

      // Check if there's a next page
      if (!hasNextPageLink(html)) {
        console.log(`✅ No more pages after page ${page}`);
        break;
      }

      page++;

      // Add a small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error fetching page ${page}:`, error);
      break;
    }
  }

  // Remove duplicates
  const uniqueShows = removeDuplicateShows(allShows);
  console.log(`🧹 Removed ${allShows.length - uniqueShows.length} duplicate shows`);

  return uniqueShows;
}

/**
 * Parse HTML from livemusicnelson.ca and extract show data from a single page
 */
async function parseNelsonEventsFromPage(html: string): Promise<Show[]> {
  const shows: Show[] = [];

  try {
    // livemusicnelson.ca uses WordPress event calendar (same as Kelowna)
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

    // If no shows found, try fetching individual event pages
    if (shows.length === 0) {
      console.log('⚠️ No shows found with HTML patterns, extracting event URLs...');
      return await parseEventLinks(html);
    }
    
    // Second pass: Fetch individual pages for shows with "General" genre to get Event Categories
    const showsNeedingGenres = shows.filter(s => 
      s.genre.length === 1 && s.genre[0] === 'General' && 
      s.sourceUrl && s.sourceUrl.includes('/event/')
    );
    
    if (showsNeedingGenres.length > 0) {
      console.log(`📋 Fetching ${showsNeedingGenres.length} event pages to extract genres...`);
      
      // Process in batches of 10 to be respectful
      const batchSize = 10;
      for (let i = 0; i < showsNeedingGenres.length; i += batchSize) {
        const batch = showsNeedingGenres.slice(i, i + batchSize);
        console.log(`Processing genre batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(showsNeedingGenres.length / batchSize)} (${batch.length} pages)`);
        
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
            } else {
              console.warn(`Failed to fetch genre page for: ${show.title} (${response.status})`);
            }
          } catch (error) {
            console.warn(`Failed to fetch genre page for: ${show.title}`);
          }
        });
        
        await Promise.all(promises);
        
        // Add delay between batches (except for the last batch)
        if (i + batchSize < showsNeedingGenres.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

  } catch (error) {
    console.error('Error parsing events:', error);
  }

  return shows;
}

/**
 * Parse event links and fetch individual event pages
 */
async function parseEventLinks(html: string): Promise<Show[]> {
  const shows: Show[] = [];
  
  // Look for links to individual event pages
  const eventLinkPattern = /href="(https:\/\/livemusicnelson\.ca\/event\/[^"]+)"/gi;
  const links = [...html.matchAll(eventLinkPattern)];
  
  console.log(`Found ${links.length} event page links`);
  
  // Fetch all unique event pages with batching to avoid overwhelming the server
  const uniqueLinks = [...new Set(links.map(m => m[1]))];
  console.log(`Processing ${uniqueLinks.length} unique event pages`);
  
  // Process in batches of 10 to be respectful to the server
  const batchSize = 10;
  for (let i = 0; i < uniqueLinks.length; i += batchSize) {
    const batch = uniqueLinks.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(uniqueLinks.length / batchSize)} (${batch.length} pages)`);
    
    const batchPromises = batch.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          const eventHtml = await response.text();
          const show = extractShowDataFromEventPage(eventHtml);
          if (show && show.title && show.date) {
            return show;
          }
        } else {
          console.warn(`Failed to fetch event page: ${url} (${response.status})`);
        }
      } catch (error) {
        console.warn(`Failed to fetch event page: ${url}`);
      }
      return null;
    });
    
    const batchResults = await Promise.all(batchPromises);
    const validShows = batchResults.filter((show): show is Show => show !== null);
    shows.push(...validShows);
    
    console.log(`Batch completed: ${validShows.length}/${batch.length} successful`);
    
    // Add delay between batches (except for the last batch)
    if (i + batchSize < uniqueLinks.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      /<a[^>]*href="(https:\/\/livemusicnelson\.ca\/event\/[^"]+)"/i,
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

    // Extract date
    let dateStr = '';
    const datePatterns = [
      /<time[^>]*datetime="([^"]+)"/i,
      /<span[^>]*class="[^"]*tribe-event-date-start[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
      /<time[^>]*class="[^"]*tribe-events-calendar-list__event-datetime[^"]*"[^>]*>([\s\S]*?)<\/time>/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        dateStr = match[1];
        break;
      }
    }

    // Extract time
    let time = '';
    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/i,
      /<span[^>]*class="[^"]*tribe-event-time[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    ];
    
    for (const pattern of timePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        time = stripHtml(match[1]);
        break;
      }
    }

    // Extract venue
    let venue = '';
    const venuePatterns = [
      /<span[^>]*class="[^"]*tribe-events-calendar-list__event-venue-title[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
      /<a[^>]*class="[^"]*tribe-events-calendar-list__event-venue-title[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
      /<dd[^>]*class="[^"]*tribe-venue[^"]*"[^>]*>([\s\S]*?)<\/dd>/i,
    ];
    
    for (const pattern of venuePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        venue = stripHtml(match[1]);
        break;
      }
    }

    // Extract genres from categories
    const genres: string[] = [];
    const categoryPattern = /<a[^>]*rel="category tag"[^>]*>([\s\S]*?)<\/a>/gi;
    const categoryMatches = eventHtml.matchAll(categoryPattern);
    
    for (const match of categoryMatches) {
      const genre = stripHtml(match[1]);
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    }

    // Extract description
    let description = '';
    const descPatterns = [
      /<div[^>]*class="[^"]*tribe-events-calendar-list__event-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<p[^>]*class="[^"]*excerpt[^"]*"[^>]*>([\s\S]*?)<\/p>/i,
    ];
    
    for (const pattern of descPatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        description = stripHtml(match[1]).substring(0, 500);
        break;
      }
    }

    if (!title || !dateStr) {
      return null;
    }

    return {
      title,
      artist: title,
      venue: venue || 'TBA',
      venueAddress: '',
      city: 'Nelson',
      date: formatDate(dateStr),
      time: time || 'TBA',
      genre: genres.length > 0 ? genres.slice(0, 3) : ['General'],
      description: description || `${title} at ${venue}`,
      sourceUrl: eventUrl,
    };
  } catch (error) {
    console.error('Error extracting show data:', error);
    return null;
  }
}

/**
 * Extract genres from event page by looking for "Event Category"
 */
function extractGenresFromEventPage(html: string): string[] {
  const genres: string[] = [];
  
  try {
    // Pattern 1: Look for "Event Category" label and extract adjacent values
    const categoryPatterns = [
      // WordPress "Event Category:" label followed by links
      /Event\s+Categor(?:y|ies):?\s*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i,
      // Alternative: Direct category section
      /<dt[^>]*>Event\s+Categor(?:y|ies):?<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i,
      // Another common pattern
      /<span[^>]*class="[^"]*tribe-events-event-categories[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
    ];
    
    let categoryHtml = '';
    for (const pattern of categoryPatterns) {
      const match = html.match(pattern);
      if (match) {
        categoryHtml = match[1];
        console.log('✅ Found Event Category section');
        break;
      }
    }
    
    if (categoryHtml) {
      // First try to extract links (WordPress format)
      const categoryLinks = categoryHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      const linkGenres = Array.from(categoryLinks).map(m => stripHtml(m[1]));
      
      if (linkGenres.length > 0) {
        genres.push(...linkGenres);
        console.log(`✅ Extracted ${linkGenres.length} genres from links: ${linkGenres.join(', ')}`);
      } else {
        // Fallback: Extract plain text and split by commas
        const plainText = stripHtml(categoryHtml).trim();
        if (plainText) {
          const parsedGenres = plainText.split(',').map(g => g.trim()).filter(g => g);
          genres.push(...parsedGenres);
          console.log(`✅ Extracted ${parsedGenres.length} genres from text: ${parsedGenres.join(', ')}`);
        }
      }
    } else {
      console.log('⚠️ No Event Category section found in HTML');
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

    return filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ['General'];
  } catch (error) {
    console.error('Error extracting genres from event page:', error);
    return ['General'];
  }
}

/**
 * Extract show data from full event page HTML
 */
function extractShowDataFromEventPage(html: string): Show | null {
  try {
    // Extract title
    const titleMatch = html.match(/<h1[^>]*class="[^"]*tribe-events-single-event-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : '';

    // Extract date
    const dateMatch = html.match(/<span[^>]*class="[^"]*tribe-event-date-start[^"]*"[^>]*>([^<]+)<\/span>/i);
    const dateStr = dateMatch ? dateMatch[1] : '';

    // Extract time
    const timeMatch = html.match(/(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM))/i);
    const time = timeMatch ? timeMatch[1] : 'TBA';

    // Extract venue
    const venueMatch = html.match(/<dt[^>]*>Venue:<\/dt>\s*<dd[^>]*class="[^"]*tribe-venue[^"]*"[^>]*>([\s\S]*?)<\/dd>/i);
    let venue = 'TBA';
    if (venueMatch) {
      const venueHtml = venueMatch[1];
      const venueNameMatch = venueHtml.match(/>([^<]+)</);
      venue = venueNameMatch ? stripHtml(venueNameMatch[1]) : 'TBA';
    }

    // Extract genres using the exact "Event Category" section
    const genres = extractGenresFromEventPage(html);

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
      city: 'Nelson',
      date: formatDate(dateStr),
      time,
      genre: genres.length > 0 ? genres.slice(0, 3) : ['General'],
      description: description || `${title} at ${venue}`,
      imageUrl,
      sourceUrl: 'https://livemusicnelson.ca',
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
            city: 'Nelson',
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
