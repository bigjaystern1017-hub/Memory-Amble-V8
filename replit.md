# MemoryAmble

A memory training web app for seniors (ages 70+) that uses the Memory Palace technique. Features a beat-by-beat conversational coaching experience with a coach named Timbuk who guides users through an open-ended level-based curriculum with daily check-ins and coaching-style prompts.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express.js with item assignment, AI spark hints, and auth/progress APIs
- **AI**: OpenAI gpt-4o-mini (only for optional "spark" hints during co-creation)
- **Auth**: Supabase Auth (Google + Email/Password); JWT verified server-side
- **Database**: PostgreSQL via Drizzle ORM
- **Persistence**: DB for progress, sessions, palaces; localStorage only for education-seen flag

## Routing

- `/` - Public landing page (landing.tsx)
- `/login` - Supabase auth page with Google + Email/Password (login.tsx)
- `/amble` - Training chat page (amble.tsx) -- guests can play Day 1 without signing in

## 5-Day Bootcamp Curriculum (Hard-Coded)

Consistent, professional 5-day progression:
1. **Day 1: The Foundation** - 3 items, Vivid Imagery, no cleaning, no reverse
2. **Day 2: The Expansion** - 5 items, Making Space, cleaning, no reverse
3. **Day 3: The Reverse** - 5 items, Mental Agility, cleaning, reverse recall
4. **Day 4: The Stretch** - 8 items, Volume, cleaning, no reverse
5. **Day 5: The Graduation** - 10 items, Mastery, cleaning, reverse recall

- **Categories**: All days use "objects" category (future: may switch to "names" after bootcamp)
- **Cleaning**: Palace wipe (Fresh Breeze technique) on Days 2-5
- **Reverse**: Recall walks stops backward on Days 3 & 5
- **Streaks**: Tracked server-side based on consecutive daily logins

## Daily Progression Flow

- **First visit**: Education slides -> Name Entry -> Day 1 (3 items, "The Foundation")
- **Returning user**: Education already seen -> Name Entry (for guests only) -> Day N lesson
- **Session completion**: currentDay saved to DB (for auth users) or localStorage (for guests)
- **Page refresh**: App reads currentDay from storage and resumes at same day
- **Curriculum-driven**: Item count, title, focus, cleaning, and reverse flags all from BOOTCAMP_CURRICULUM

## App Flow

### Phase 1: Education (slides) -- first visit only
3 slides: History, How It Works, Why It Works. Skipped for returning users.

### Phase 2: Chat Conversation (dynamic beats)

**Returning users get check-in first:**
1. **Check-In** - Timbuk quizzes yesterday's items one by one
2. **Check-In Done** - Score summary, transition to today's lesson

**Then the main walk:**
1. **Welcome** - Continue button
2. **Interview** (Your Palace) - Ask for place, then N stops (driven by level)
3. **Co-Creation** (Remember) - For each item: assign, user describes scene, Timbuk mirrors
4. **Walkthrough** (Recall) - Recall each item at each stop (may be reverse)
5. **Palace Wipe** - If cleaning=true, guide Fresh Breeze clearing technique
6. **Graduation Offer** - If 100% score, congratulate and announce level-up
7. **Results** - Score, warm encouragement, session saved to DB

## Timbuk's Coaching Style

- Timbuk is a COACH, not a narrator
- Uses open-ended prompts: "What do you see happening?" / "Make it bold, vivid, and unique to you."
- Category-aware: different prompts for objects ("place this object") vs names ("imagine meeting")
- Warm, encouraging, concise during placement/recall phases

## Key Design Decisions

- Level/progression stored in DB `user_progress` table (currentLevel, currentCategory, dayCount, streak)
- Session history stored in DB `session_history` table (for check-in recall of yesterday's items)
- Beat engine uses generic beats with stepIndex for looping over N items
- `lessonConfig.reverse` flag drives reverse recall order via `recallAssignmentIndex()`
- `lessonConfig.cleaning` flag inserts palace-wipe beat after recall
- Header shows level info, streak, day label, and sign out
- Pronoun reversal: "My old office" -> Timbuk says "your old office"
- Mobile-first: 100dvh, safe area insets, no auto-zoom on inputs
- Large text (xl-2xl) for senior accessibility
- Warm cream/stone palette (hue 40), Open Sans + Lora
- No emoji -- Lucide icons only
- Web Speech API mic button for voice input
- Dev Reset button (bottom-right corner) clears localStorage and reloads

## File Structure

- `client/src/pages/landing.tsx` - Public landing page with hero and CTA; shows "Continue Day X" for authenticated users
- `client/src/pages/login.tsx` - Supabase auth: Google + Email/Password
- `client/src/pages/amble.tsx` - Protected training chat with beat engine; saves currentDay on session completion
- `client/src/lib/supabase.ts` - Supabase client (uses VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)
- `client/src/lib/progress.ts` - Pure utility: getLessonConfig (uses BOOTCAMP_CURRICULUM), getNextLevel, shouldSwitchCategory
- `client/src/components/beat-engine.ts` - Dynamic beat flow, coaching messages, state machine
- `client/src/components/education-slides.tsx` - 3 educational slides
- `client/src/components/progress-bar.tsx` - 5-step progress indicator
- `client/src/components/chat-message.tsx` - Chat bubble with typewriter effect
- `client/src/components/chat-input.tsx` - Text input with mic button
- `client/src/hooks/use-auth.ts` - Supabase auth hook (session, user, signOut)
- `client/src/name-entry.tsx` - Name collection for guests and first-time users
- `server/auth.ts` - Supabase JWT verification middleware
- `server/routes.ts` - All API routes (assign-objects, spark, progress, palaces, sessions, user/current-day, user/progress)
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema (palaces, userProgress, sessionHistory, Assignment type)
- `shared/curriculum.ts` - Hard-coded BOOTCAMP_CURRICULUM (5-day progression)

## DB Schema

- `user_progress`: id, userId, currentDay, currentLevel, currentCategory, dayCount, streak, lastLogin
- `session_history`: id, userId, date, level, category, score, totalItems, assignmentsJson, placeName, stopsJson
- `palaces`: id, userId, locationName, position

## API Endpoints

- `POST /api/assign-objects` - Assigns random objects/names to stops. Body: `{stops, category}`
- `POST /api/spark` - AI generates a short hint (gpt-4o-mini)
- `GET /api/progress` - Get user's progression data (auth required)
- `POST /api/progress` - Save progression data (auth required)
- `GET /api/sessions/latest` - Get most recent session for check-in (auth required)
- `POST /api/sessions` - Save a completed session (auth required)
- `GET /api/palaces` - Get user's palace locations (auth required)
- `POST /api/palaces` - Save palace locations (auth required)
- `POST /api/user/current-day` - Update user's currentDay in DB (auth required). Body: `{currentDay}`
- `GET /api/user/progress` - Fetch user's full progress from DB (auth required)

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (for spark hints)
- `DATABASE_URL` - PostgreSQL connection string
- `SUPABASE_URL` - Supabase project URL (server-side)
- `SUPABASE_ANON_KEY` - Supabase anonymous key (server-side)
- `VITE_SUPABASE_URL` - Supabase project URL (client-side, same value as SUPABASE_URL)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key (client-side, same value as SUPABASE_ANON_KEY)
