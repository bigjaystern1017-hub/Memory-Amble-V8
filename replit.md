# MemoryAmble

A memory training web app for seniors (ages 70+) that uses the Memory Palace technique to help users remember things through vivid, funny visual associations.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Express.js with OpenAI API route
- **AI**: Replit AI Integrations (OpenAI) - gpt-4o-mini for generating vivid memory associations
- **No database needed** - session-based coaching experience, all state in React

## App Flow

1. **Education Step** - Card-based walkthrough explaining Memory Palace history and technique
2. **Interview Step** - User picks a familiar place and 3 stops within it
3. **Placement Step** - AI generates bizarre/funny visual associations for 3 random objects at those stops, shown one-by-one
4. **Walkthrough Step** - User mentally walks through palace and recalls objects at each stop
5. **Results Step** - Score and review with encouragement

## Key Design Decisions

- Warm cream/stone color palette (hue 40) already configured in index.css
- Large fonts (base 17px, headings up to 40px) for senior accessibility
- Open Sans (body) + Lora (serif headings) typography
- High-contrast, touch-friendly buttons (py-6 padding)
- Linear flow - never overwhelming
- Framer Motion for smooth, gentle page transitions

## File Structure

- `client/src/pages/home.tsx` - Main page with step state management
- `client/src/components/education-step.tsx` - Memory Palace education cards
- `client/src/components/interview-step.tsx` - Place and stop selection
- `client/src/components/placement-step.tsx` - AI-generated scene viewer
- `client/src/components/walkthrough-step.tsx` - Recall/quiz interface
- `client/src/components/results-step.tsx` - Score and review
- `client/src/components/progress-bar.tsx` - Visual step progress indicator
- `server/routes.ts` - POST /api/generate-associations endpoint
- `shared/schema.ts` - Zod schemas and TypeScript types

## Environment Variables

- `AI_INTEGRATIONS_OPENAI_API_KEY` - Provided by Replit AI Integrations
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Provided by Replit AI Integrations
