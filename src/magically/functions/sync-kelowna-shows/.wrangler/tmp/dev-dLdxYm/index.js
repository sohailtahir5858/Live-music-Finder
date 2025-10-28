var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ZsQ3JC/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// index.ts
var index_default = {
  async fetch(request, env) {
    try {
      console.log("\u{1F3B5} Starting Kelowna show sync...");
      const eventsUrl = "https://livemusickelowna.ca/events/";
      const response = await fetch(eventsUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch events: ${response.status}`);
      }
      const html = await response.text();
      console.log("\u2705 Fetched events page");
      const allShows = await parseAllKelownaEvents();
      console.log(`\u{1F4CA} Found ${allShows.length} total shows from all pages`);
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const shows = allShows.filter((show) => {
        const showDate = new Date(show.date);
        return showDate >= today;
      });
      console.log(`\u2705 Filtered to ${shows.length} future shows (removed ${allShows.length - shows.length} past shows)`);
      const syncResults = await syncShowsToDatabase(env, shows);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Kelowna shows synced successfully",
          stats: syncResults,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("\u274C Error syncing Kelowna shows:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  },
  // Cron trigger - runs daily at 6 AM PST
  async scheduled(event, env, ctx) {
    console.log("\u23F0 Cron triggered - syncing Kelowna shows");
    const request = new Request("https://sync-kelowna-shows.worker", {
      method: "POST"
    });
    await this.fetch(request, env);
  }
};
async function parseAllKelownaEvents() {
  const allShows = [];
  const baseUrl = "https://livemusickelowna.ca/events/";
  const maxPages = 10;
  try {
    let currentPage = 1;
    let hasNextPage = true;
    while (hasNextPage && currentPage <= maxPages) {
      const pageUrl = currentPage === 1 ? baseUrl : `${baseUrl}page/${currentPage}/`;
      console.log(`\u{1F50D} Scraping page ${currentPage}: ${pageUrl}`);
      try {
        const response = await fetch(pageUrl);
        if (!response.ok) {
          console.warn(`Failed to fetch page ${currentPage}: ${response.status}`);
          break;
        }
        const html = await response.text();
        const pageShows = await parseKelownaEventsFromPage(html);
        if (pageShows.length === 0) {
          console.log(`\u{1F4C4} Page ${currentPage} has no events, stopping pagination`);
          break;
        }
        console.log(`\u2705 Found ${pageShows.length} shows on page ${currentPage}`);
        allShows.push(...pageShows);
        hasNextPage = hasNextPageLink(html);
        currentPage++;
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      } catch (error) {
        console.error(`Error scraping page ${currentPage}:`, error);
        break;
      }
    }
    console.log(`\u{1F3AF} Total shows scraped from all pages: ${allShows.length}`);
    const uniqueShows = removeDuplicateShows(allShows);
    console.log(`\u{1F9F9} Removed ${allShows.length - uniqueShows.length} duplicate shows`);
    const showsNeedingGenres = uniqueShows.filter(
      (s) => s.genre.length === 1 && s.genre[0] === "General" && s.sourceUrl && s.sourceUrl.includes("/event/")
    );
    if (showsNeedingGenres.length > 0) {
      console.log(`\u{1F4CB} Fetching genres for ${showsNeedingGenres.length} events...`);
      const batchSize = 10;
      for (let i = 0; i < showsNeedingGenres.length; i += batchSize) {
        const batch = showsNeedingGenres.slice(i, i + batchSize);
        console.log(`\u{1F504} Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(showsNeedingGenres.length / batchSize)}`);
        const promises = batch.map(async (show) => {
          try {
            const response = await fetch(show.sourceUrl);
            if (response.ok) {
              const eventHtml = await response.text();
              const extractedGenres = extractGenresFromEventPage(eventHtml);
              if (extractedGenres && extractedGenres.length > 0 && extractedGenres[0] !== "General") {
                show.genre = extractedGenres;
                console.log(`\u2705 Updated "${show.title}" genre to: ${show.genre.join(", ")}`);
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch event page for: ${show.title}`);
          }
        });
        await Promise.all(promises);
        if (i + batchSize < showsNeedingGenres.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  } catch (error) {
    console.error("Error in parseAllKelownaEvents:", error);
  }
  return allShows;
}
__name(parseAllKelownaEvents, "parseAllKelownaEvents");
function hasNextPageLink(html) {
  const nextPagePatterns = [
    /<link[^>]*rel="next"[^>]*href="[^"]*\/page\/\d+\/?"[^>]*>/i,
    /<a[^>]*href="[^"]*\/page\/\d+\/?"[^>]*>Next|»|&raquo;/i,
    /<link[^>]*rel="next"/i,
    /class="[^"]*next[^"]*"/i
  ];
  return nextPagePatterns.some((pattern) => pattern.test(html));
}
__name(hasNextPageLink, "hasNextPageLink");
function removeDuplicateShows(shows) {
  const seen = /* @__PURE__ */ new Set();
  return shows.filter((show) => {
    const key = `${show.title}-${show.venue}-${show.date}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
__name(removeDuplicateShows, "removeDuplicateShows");
async function parseKelownaEventsFromPage(html) {
  const shows = [];
  try {
    const patterns = [
      // The Events Calendar plugin (tribe-events)
      /<article[^>]*class="[^"]*tribe-events-calendar-list__event-row[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
      /<div[^>]*class="[^"]*tribe-common-g-row[^"]*"[^>]*data-event-id="[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
      // Generic event patterns
      /<article[^>]*class="[^"]*(?:event|upcoming)[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
    ];
    for (const pattern of patterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`\u2705 Found ${matches.length} events with pattern`);
        for (const match of matches) {
          const eventHtml = match[1] || match[0];
          try {
            const show = extractShowData(eventHtml, html);
            if (show && show.title && show.date) {
              shows.push(show);
            }
          } catch (err) {
            console.warn("Failed to parse individual event:", err);
          }
        }
        if (shows.length > 0) break;
      }
    }
    if (shows.length === 0) {
      console.log("\u26A0\uFE0F No shows found with HTML patterns, extracting event URLs...");
      const eventShows = await parseEventLinks(html);
      shows.push(...eventShows);
    }
  } catch (error) {
    console.error("Error parsing events from page:", error);
  }
  return shows;
}
__name(parseKelownaEventsFromPage, "parseKelownaEventsFromPage");
async function parseEventLinks(html) {
  const shows = [];
  const eventLinkPattern = /href="(https:\/\/livemusickelowna\.ca\/event\/[^"]+)"/gi;
  const links = [...html.matchAll(eventLinkPattern)];
  console.log(`Found ${links.length} event page links`);
  const uniqueLinks = [...new Set(links.map((m) => m[1]))].slice(0, 20);
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
__name(parseEventLinks, "parseEventLinks");
function extractShowData(eventHtml, fullHtml) {
  try {
    let eventUrl = "";
    const urlPatterns = [
      /<a[^>]*class="[^"]*tribe-events-calendar-list__event-title-link[^"]*"[^>]*href="([^"]+)"/i,
      /<a[^>]*href="(https:\/\/livemusickelowna\.ca\/event\/[^"]+)"/i
    ];
    for (const pattern of urlPatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        eventUrl = match[1];
        break;
      }
    }
    let title = "";
    const titlePatterns = [
      /<h3[^>]*class="[^"]*tribe-events-calendar-list__event-title[^"]*"[^>]*>\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h3>/i,
      /<a[^>]*class="[^"]*tribe-events-calendar-list__event-title-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i,
      /<h3[^>]*class="[^"]*(?:event-title|entry-title)[^"]*"[^>]*>([\s\S]*?)<\/h3>/i,
      /<a[^>]*class="[^"]*(?:event-url|tribe-event-url)[^"]*"[^>]*>([\s\S]*?)<\/a>/i
    ];
    for (const pattern of titlePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        title = stripHtml(match[1]);
        break;
      }
    }
    let dateStr = "";
    const datePatterns = [
      /<time[^>]*datetime="([^"]+)"/i,
      /class="[^"]*tribe-event-date-start[^"]*"[^>]*datetime="([^"]+)"/i,
      /class="[^"]*tribe-events-calendar-list__event-datetime[^"]*"[^>]*>([^<]+)</i
    ];
    for (const pattern of datePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        dateStr = match[1];
        break;
      }
    }
    const timePatterns = [
      /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i,
      /@\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i
    ];
    let time = "";
    for (const pattern of timePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        time = match[1];
        break;
      }
    }
    let venue = "";
    const venuePatterns = [
      /class="[^"]*tribe-events-calendar-list__event-venue-title[^"]*"[^>]*>([^<]+)</i,
      /class="[^"]*tribe-event-venue[^"]*"[^>]*>([^<]+)</i,
      /<span[^>]*class="[^"]*venue[^"]*"[^>]*>([^<]+)</i
    ];
    for (const pattern of venuePatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        venue = stripHtml(match[1]);
        break;
      }
    }
    const genres = [];
    const eventCategoryMatch = eventHtml.match(/<dt[^>]*>Event Category[^<]*<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/i);
    if (eventCategoryMatch) {
      const categoryHtml = eventCategoryMatch[1];
      const categoryLinks = categoryHtml.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      genres.push(...Array.from(categoryLinks).map((m) => stripHtml(m[1])));
    }
    if (genres.length === 0) {
      const categoryContainerMatch = eventHtml.match(/class="[^"]*tribe-events-event-categories[^"]*"[^>]*>([\s\S]*?)<\/(?:div|span|ul)>/i);
      if (categoryContainerMatch) {
        const categoryText = stripHtml(categoryContainerMatch[1]);
        const cats = categoryText.split(/[,\/]/).map((c) => c.trim()).filter((c) => c.length > 0);
        genres.push(...cats);
      }
    }
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
    const filterTerms = ["event", "events", "calendar", "venue", "upcoming"];
    const filteredGenres = genres.filter(
      (g) => !filterTerms.some((term) => g.toLowerCase().includes(term))
    );
    const imageMatch = eventHtml.match(/<img[^>]*src="([^"]+)"/i);
    const imageUrl = imageMatch && !imageMatch[1].includes("placeholder") ? imageMatch[1] : void 0;
    const descPatterns = [
      /class="[^"]*tribe-events-calendar-list__event-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ];
    let description = "";
    for (const pattern of descPatterns) {
      const match = eventHtml.match(pattern);
      if (match) {
        description = stripHtml(match[1]).substring(0, 500);
        break;
      }
    }
    if (eventUrl && filteredGenres.length === 0) {
      console.log(`\u26A0\uFE0F No genres found in listing for "${title}", need to fetch: ${eventUrl}`);
    }
    if (!title || !dateStr) {
      console.log(`\u26A0\uFE0F Returning null - missing data: title="${title}", dateStr="${dateStr}"`);
      return null;
    }
    return {
      title,
      artist: title,
      venue: venue || "TBA",
      venueAddress: "",
      city: "Kelowna",
      date: formatDate(dateStr),
      time: time || "TBA",
      genre: filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ["General"],
      description: description || `${title} at ${venue || "venue TBA"}`,
      imageUrl,
      sourceUrl: eventUrl || "https://livemusickelowna.ca"
    };
  } catch (error) {
    console.error("Error extracting show data:", error);
    return null;
  }
}
__name(extractShowData, "extractShowData");
function extractGenresFromEventPage(html) {
  const genres = [];
  try {
    const broadMatch = html.match(/Event Categor(?:y|ies)[^<]*([\s\S]{0,500})/i);
    if (broadMatch) {
      const snippet = broadMatch[0];
      const links = snippet.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      const linkGenres = Array.from(links).map((m) => stripHtml(m[1]));
      if (linkGenres.length > 0) {
        genres.push(...linkGenres);
      } else {
        const textMatch = snippet.match(/Event Categor(?:y|ies)[:\s]*([^<]+)/i);
        if (textMatch) {
          const plainText = stripHtml(textMatch[1]).trim();
          if (plainText && plainText.length < 200) {
            const parsedGenres = plainText.split(",").map((g) => g.trim()).filter((g) => g && g.length > 1);
            genres.push(...parsedGenres);
          }
        }
      }
    }
    if (genres.length === 0) {
      const genreMatches = html.matchAll(/<a[^>]*rel="category tag"[^>]*>([^<]+)<\/a>/gi);
      genres.push(...Array.from(genreMatches).map((m) => stripHtml(m[1])));
    }
    const filterTerms = ["event", "events", "calendar", "venue", "upcoming"];
    const filteredGenres = genres.filter(
      (g) => !filterTerms.some((term) => g.toLowerCase().includes(term))
    );
    return filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ["General"];
  } catch (error) {
    console.error("Error extracting genres:", error);
    return ["General"];
  }
}
__name(extractGenresFromEventPage, "extractGenresFromEventPage");
function extractShowDataFromEventPage(html) {
  try {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*(?:tribe-events-single-event-title|entry-title)[^"]*"[^>]*>([\s\S]*?)<\/h1>/i);
    const title = titleMatch ? stripHtml(titleMatch[1]) : "";
    const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/i);
    const dateStr = dateMatch ? dateMatch[1] : "";
    const timeMatch = html.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
    const time = timeMatch ? timeMatch[1] : "TBA";
    const venueMatch = html.match(/class="[^"]*tribe-venue[^"]*"[^>]*>([^<]+)</i);
    const venue = venueMatch ? stripHtml(venueMatch[1]) : "TBA";
    const genres = [];
    const broadMatch = html.match(/Event Categor(?:y|ies)[^<]*([\s\S]{0,500})/i);
    if (broadMatch) {
      const snippet = broadMatch[0];
      console.log(`\u2705 Found Event Category snippet: ${snippet.substring(0, 200)}`);
      const links = snippet.matchAll(/<a[^>]*>([^<]+)<\/a>/gi);
      const linkGenres = Array.from(links).map((m) => stripHtml(m[1]));
      if (linkGenres.length > 0) {
        genres.push(...linkGenres);
        console.log(`\u2705 Extracted ${linkGenres.length} genres from links: ${linkGenres.join(", ")}`);
      } else {
        const textMatch = snippet.match(/Event Categor(?:y|ies)[:\s]*([^<]+)/i);
        if (textMatch) {
          const plainText = stripHtml(textMatch[1]).trim();
          if (plainText && plainText.length < 200) {
            const parsedGenres = plainText.split(",").map((g) => g.trim()).filter((g) => g && g.length > 1);
            genres.push(...parsedGenres);
            console.log(`\u2705 Extracted ${parsedGenres.length} genres from text: ${parsedGenres.join(", ")}`);
          }
        }
      }
    } else {
      console.log("\u26A0\uFE0F No Event Category text found anywhere in HTML");
    }
    if (genres.length === 0) {
      const genreMatches = html.matchAll(/<a[^>]*rel="category tag"[^>]*>([^<]+)<\/a>/gi);
      genres.push(...Array.from(genreMatches).map((m) => stripHtml(m[1])));
    }
    const filterTerms = ["event", "events", "calendar", "venue", "upcoming"];
    const filteredGenres = genres.filter(
      (g) => !filterTerms.some((term) => g.toLowerCase().includes(term))
    );
    const descMatch = html.match(/class="[^"]*tribe-events-single-event-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const description = descMatch ? stripHtml(descMatch[1]).substring(0, 500) : "";
    const imageMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
    const imageUrl = imageMatch ? imageMatch[1] : void 0;
    if (!title || !dateStr) {
      return null;
    }
    return {
      title,
      artist: title,
      venue,
      venueAddress: "",
      city: "Kelowna",
      date: formatDate(dateStr),
      time,
      genre: filteredGenres.length > 0 ? filteredGenres.slice(0, 3) : ["General"],
      description: description || `${title} at ${venue}`,
      imageUrl,
      sourceUrl: "https://livemusickelowna.ca"
    };
  } catch (error) {
    console.error("Error extracting from event page:", error);
    return null;
  }
}
__name(extractShowDataFromEventPage, "extractShowDataFromEventPage");
function stripHtml(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&lsquo;/g, "'").replace(/&rsquo;/g, "'").replace(/&ldquo;/g, '"').replace(/&rdquo;/g, '"').replace(/&ndash;/g, "-").replace(/&mdash;/g, "-").replace(/&hellip;/g, "...").replace(/&copy;/g, "(c)").replace(/&reg;/g, "(R)").replace(/&trade;/g, "(TM)").replace(/&deg;/g, "deg").replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(parseInt(dec, 10))).replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16))).trim();
}
__name(stripHtml, "stripHtml");
function formatDate(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    }
    return date.toISOString().split("T")[0];
  } catch {
    return (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  }
}
__name(formatDate, "formatDate");
async function syncShowsToDatabase(env, shows) {
  let added = 0;
  let updated = 0;
  let skipped = 0;
  for (const show of shows) {
    try {
      const queryResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.MAGICALLY_API_KEY}`,
          "X-Project-ID": env.MAGICALLY_PROJECT_ID
        },
        body: JSON.stringify({
          collection: "shows",
          query: {
            title: show.title,
            venue: show.venue,
            date: show.date,
            city: "Kelowna"
          }
        })
      });
      if (!queryResponse.ok) {
        throw new Error(`Query failed: ${queryResponse.status}`);
      }
      const existing = await queryResponse.json();
      if (existing.data && existing.data.length > 0) {
        const updateResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.MAGICALLY_API_KEY}`,
            "X-Project-ID": env.MAGICALLY_PROJECT_ID
          },
          body: JSON.stringify({
            collection: "shows",
            filter: { _id: existing.data[0]._id },
            update: show
          })
        });
        if (!updateResponse.ok) {
          throw new Error(`Update failed: ${updateResponse.status}`);
        }
        updated++;
      } else {
        const insertResponse = await fetch(`${env.MAGICALLY_API_BASE_URL}/data/insert`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.MAGICALLY_API_KEY}`,
            "X-Project-ID": env.MAGICALLY_PROJECT_ID
          },
          body: JSON.stringify({
            collection: "shows",
            document: {
              ...show,
              isPublic: true
              // Shows are public data
            }
          })
        });
        if (!insertResponse.ok) {
          throw new Error(`Insert failed: ${insertResponse.status}`);
        }
        added++;
      }
    } catch (error) {
      console.error("Error syncing show:", show.title, error);
      skipped++;
    }
  }
  return { added, updated, skipped, total: shows.length };
}
__name(syncShowsToDatabase, "syncShowsToDatabase");

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-ZsQ3JC/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = index_default;

// ../../../../../../.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-ZsQ3JC/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
