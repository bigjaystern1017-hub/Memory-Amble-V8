# MemoryAmble

A memory training web app for seniors (ages 70+) that uses the Memory Palace technique. Features a beat-by-beat conversational coaching experience with a coach named Timbuk who guides users through an open-ended level-based curriculum with daily check-ins and coaching-style prompts.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express.js with item assignment, AI spark hints, and auth/progress APIs
- **AI**: OpenAI gpt-4o-mini (only for optional "spark" hints during co-creation)
- **Auth**: Replit Auth (login with Replit account)
- **Database**: PostgreSQL via Drizzle ORM
- **Persistence**: DB for progress, sessions, palaces; localStorage only for education-seen flag

## Level-Based Progression System

- **Levels**: Item count starts at 3, graduates by +2 on a perfect score (3 -> 5 -> 7 -> 9, max 10)
- **Categories**: Starts with "objects", switches to "names" after 7 consecutive object days
- **Cleaning**: After recall, Timbuk guides a "palace wipe" (after day 1)
- **Reverse**: Recall phase walks stops in reverse order on even days (after day 2)
- **Streaks**: Tracked server-side based on consecutive daily logins

## Daily Progression Flow

- **First visit**: Education slides -> Day 1 (3 items, objects)
- **Returning user**: Check-in on yesterday's items -> today's lesson at current level
- **Graduation**: Perfect score (100%) -> level up by +2 items next session
- **Category switch**: After 7 days of objects -> switch to names

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

- `client/src/pages/home.tsx` - Main page: auth gate, education, chat, progression logic
- `client/src/lib/progress.ts` - Pure utility: getLessonConfig, getNextLevel, shouldSwitchCategory
- `client/src/components/beat-engine.ts` - Dynamic beat flow, coaching messages, state machine
- `client/src/components/education-slides.tsx` - 3 educational slides
- `client/src/components/name-entry.tsx` - Dedicated name input screen (unused, kept for reference)
- `client/src/components/progress-bar.tsx` - 5-step progress indicator
- `client/src/components/chat-message.tsx` - Chat bubble with typewriter effect
- `client/src/components/chat-input.tsx` - Text input with mic button
- `client/src/hooks/use-auth.ts` - Replit Auth hook
- `server/routes.ts` - All API routes (assign-objects, spark, progress, palaces, sessions)
- `server/db.ts` - Database connection
- `shared/schema.ts` - Drizzle schema (palaces, userProgress, sessionHistory, Assignment type)
- `server/replit_integrations/auth/` - Replit Auth blueprint

## DB Schema

- `user_progress`: id, userId, currentDay, currentLevel, currentCategory, dayCount, streak, lastLogin
- `session_history`: id, userId, date, level, category, score, totalItems, assignmentsJson, placeName, stopsJson
- `palaces`: id, userId, locationName, position
- `users`: Replit Auth users table
- `sessions`: Replit Auth sessions table (do not modify)

## API Endpoints

- `POST /api/assign-objects` - Assigns random objects/names to stops. Body: `{stops, category}`
- `POST /api/spark` - AI generates a short hint (gpt-4o-mini)
- `GET /api/progress` - Get user's progression data (auth required)
- `POST /api/progress` - Save progression data (auth required)
- `GET /api/sessions/latest` - Get most recent session for check-in (auth required)
- `POST /api/sessions` - Save a completed session (auth required)
- `GET /api/palaces` - Get user's palace locations (auth required)
- `POST /api/palaces` - Save palace locations (auth required)
- Auth routes: `/api/login`, `/api/logout`, `/api/callback`, `/api/auth/user`

## Environment Variables

- `OPENAI_API_KEY` - OpenAI API key (for spark hints)
- `SESSION_SECRET` - Express session secret
- `DATABASE_URL` - PostgreSQL connection string
