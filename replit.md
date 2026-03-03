# MemoryAmble

A memory training web app for seniors (ages 70+) that uses the Memory Palace technique. Features a beat-by-beat conversational coaching experience with a coach named Timbuk who guides users through building and testing a Memory Palace, with daily progression and level advancement.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express.js with item assignment and optional AI spark hint
- **AI**: OpenAI gpt-4o-mini (user's own API key) - only used for optional "spark" hints during co-creation
- **Persistence**: localStorage for daily progression (UserProgress)
- **No database** - all state in React + localStorage

## Daily Progression System

- **First visit**: Education slides → Name entry → 3-item walk
- **Returning user**: Skip education, check-in on yesterday's items → today's walk
- **Graduation**: 100% score → level up by +2 items (3→5→7→9, max 9, never jump >2)
- **Category variety**: After 7 consecutive "objects" days → switch to "names"
- **Already done today**: Show friendly "come back tomorrow" message

## App Flow

### Phase 1: Education (slides) — first visit only
3 slides: History, How It Works, Why It Works. Skipped for returning users.

### Phase 2: Name Entry — first visit only

### Phase 3: Chat Conversation (dynamic beats)

**Returning users get check-in first:**
1. **Check-In** - Timbuk quizzes yesterday's items one by one
2. **Graduation Offer** - If perfect score yesterday, offer to increase item count

**Then the main walk:**
1. **Welcome** - Continue button
2. **Interview** (Your Palace) - Ask for place, then N stops (dynamic based on level)
3. **Co-Creation** (Remember) - For each of N objects/names: assign, user describes scene, Timbuk mirrors
4. **Walkthrough** (Recall) - Recall each item at each stop
5. **Results** - Score, warm encouragement, session saved to localStorage

## Key Design Decisions

- Dynamic item count: 3/5/7/9 items based on level (stepIndex tracks current position)
- Beat engine uses generic beats (ask-stop, place-object, recall) with stepIndex for looping
- Pronoun reversal: "My old office" → Timbuk says "your old office"
- Dialogue tiers: Chatty during onboarding, concise during placement/recall
- Mobile-first: 100dvh, safe area insets, no auto-zoom on inputs
- Large text (xl-2xl) for senior accessibility
- Warm cream/stone palette (hue 40), Open Sans + Lora
- No emoji — Lucide icons only
- Web Speech API mic button for voice input

## File Structure

- `client/src/pages/home.tsx` - Main page: education → name → chat, progression logic
- `client/src/lib/progress.ts` - localStorage persistence, level computation, session recording
- `client/src/components/beat-engine.ts` - Dynamic beat flow, message templates, state machine
- `client/src/components/education-slides.tsx` - 3 educational slides
- `client/src/components/name-entry.tsx` - Dedicated name input screen
- `client/src/components/progress-bar.tsx` - 5-step progress indicator
- `client/src/components/chat-message.tsx` - Chat bubble with typewriter effect
- `client/src/components/chat-input.tsx` - Text input with mic button
- `server/routes.ts` - POST /api/assign-objects (objects or names), POST /api/spark
- `shared/schema.ts` - Assignment type

## API Endpoints

- `POST /api/assign-objects` - Assigns items to stops. Body: `{stops: string[], category: "objects"|"names"}`
- `POST /api/spark` - AI generates a short hint (optional, gpt-4o-mini)

## Environment Variables

- `OPENAI_API_KEY` - User's own OpenAI API key (only needed for spark hints)
