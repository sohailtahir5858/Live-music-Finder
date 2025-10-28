# PROJECT CONTEXT

<!-- METADATA_START -->
Last-Summarized-Message: none
Last-Updated: 2025-10-23T19:02:52.115Z
Summarization-Version: 1.0
<!-- METADATA_END -->

## DECISION TREE
<!-- DECISION_TREE_START -->
Live Music Kelowna & Nelson App
├── [2025-10-21T20:09:12.692Z] Product: Mobile app for live music shows in Kelowna and Nelson
├── [2025-10-21T20:09:12.692Z] Target Audience: Music lovers in Kelowna and Nelson
├── [2025-10-21T20:09:12.692Z] Core Value Proposition: Provide a clean, filterable way to discover local live shows with notifications for favorite genres
├── [2025-10-22T17:14:23.393Z] Business Model: Freemium with ads for free users and premium subscription ($3.99/month) removing ads and unlocking features
├── [2025-10-22T17:15:22.541Z] Design Style: Dark premium theme with deep purple and electric blue accents
└── [2025-10-22T17:15:22.541Z] Major Features: Browse shows by city, advanced filtering, push notifications for genres, favorites system, premium features, city switcher, real-time data sync from websites
├── [2025-10-22T18:00:00.000Z] Refined free vs premium user experience with personalized 'What's On Weekly' feeds, smarter event notifications, and differentiated ad exposure.
<!-- DECISION_TREE_END -->

## PROJECT SPECIFICATIONS
<!-- PROJECT_SPECS_START -->
1. CORE FEATURES
- Browse upcoming shows by city (Kelowna/Nelson)
- Advanced filtering by genre, venue, date, and time
- Push notifications for favorite genres
- Save favorite venues, artists, and genres
- Show details with venue info, date, time, and description
- Quick city switcher between Kelowna and Nelson
- Premium subscription removes ads, unlocks unlimited favorites and advanced notifications

2. USER FLOWS
- First launch: City selection modal (Kelowna or Nelson)
- Optional authentication for saving favorites
- Browse shows list with city toggle
- Use filters to narrow down shows
- View show details
- Save favorites (requires login)
- Receive push notifications based on favorite genres
- Navigate via bottom tabs: Shows, Favorites, Notifications, Profile

3. BUSINESS RULES
- Free users see ads, limited to 5 favorites
- Premium users pay $3.99/month, no ads, unlimited favorites, priority notifications
- Shows data is public (isPublic: true) and synced from livemusickelowna.ca and livemusicnelson.ca
- Notifications triggered when new shows match user's favorite genres
- Filters persist during session

4. UI/UX REQUIREMENTS
- Dark premium theme with sleek blacks and deep purples
- Vibrant accent colors (deep purple #8B5CF6 and electric blue)
- Bottom tab navigation with max 4 tabs
- Clean, energetic nightlife feel
- Notification settings screen for controlling frequency and timing
- Built-in subscription UI in Profile screen
- Personalized 'What's On Weekly' - Free: generic weekly event list, Premium: curated feed showing only favorite genres and artists
- Smart Event Notifications: Free users get general updates about new events, Premium users get instant alerts for favorite artist/genre/venue
- Ad-Free Experience: Free users see occasional banner ads on individual event pages, Premium users get 100% ad-free experience
- Favorite Categories: Free users limited to 2 favorite genres or venues, Premium users get unlimited favorites
<!-- PROJECT_SPECS_END -->
