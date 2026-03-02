# MemoryAmble

A memory training web app for seniors (ages 70+) that uses the Memory Palace technique. Features a beat-by-beat conversational coaching experience with a coach named Timbuk who guides the user (Gladys) through building and testing a Memory Palace.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express.js with OpenAI API route
- **AI**: OpenAI (user's own API key) - gpt-4o-mini for generating vivid memory associations
- **No database needed** - session-based coaching experience, all state in React

## App Flow (Beat-by-Beat Conversation)

The app is a linear conversation between Coach Timbuk and the user Gladys:

1. **Welcome** - Timbuk introduces himself warmly
2. **Interview Beats** - Timbuk asks for a place, then 3 stops, reacting warmly to each answer
3. **Placement Beats** - AI generates bizarre associations, Timbuk coaches visualization one-by-one, asking Gladys to confirm she can see each scene
4. **Walkthrough Beats** - Timbuk asks Gladys to recall each object, reacts to each answer
5. **Final** - Warm encouragement and score

## Key Design Decisions

- Conversational chat UI (not forms/steps) - one question at a time
- Coach personality: warm, personable, uses "Wonderful," "I can see it now," "You've got this"
- Web Speech API microphone button for voice input (speech-to-text)
- Warm cream/stone color palette (hue 40) in index.css
- Large fonts for senior accessibility
- Open Sans (body) + Lora (serif) typography
- Framer Motion for smooth message animations
- Typing indicators for natural conversation feel

## File Structure

- `client/src/pages/home.tsx` - Main chat page with conversation state management
- `client/src/components/chat-message.tsx` - Chat bubble component (Timbuk/Gladys)
- `client/src/components/chat-input.tsx` - Text input with microphone button
- `client/src/components/beat-engine.ts` - Beat flow, message templates, state machine
- `server/routes.ts` - POST /api/generate-associations endpoint
- `shared/schema.ts` - Zod schemas and TypeScript types

## Environment Variables

- `OPENAI_API_KEY` - User's own OpenAI API key (stored as a secret)
