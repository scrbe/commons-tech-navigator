# Commons Tech Navigator

Commons Tech Navigator helps collectives, technology developers, and governments decide whether — and how — to introduce technology into common-pool resource systems: irrigation networks, fisheries, forests, and pasturelands.

Technology in commons governance rarely fails for technical reasons. It fails because it shifts power, disrupts collective decision-making, or ignores how communities already manage their resources. Most teams making these decisions have no structured way to learn from what has worked and what hasn't elsewhere.

Commons Tech Navigator closes that gap. Users describe their project and context through a chat interface. The agent draws on a curated database of real-world cases to surface relevant governance patterns, institutional risks, and grounded guidance — not generic AI output, but evidence tied to specific documented cases.

## Who it's for

- **Collectives and communities** evaluating whether a specific technology fits their governance structure
- **Technology developers** trying to understand the institutional context their product will enter
- **Government agencies and NGOs** designing programs that introduce digital tools into resource governance

## The core experience

The product is a single-screen chat. Users open it and start describing their situation. Four onboarding cards suggest common starting points (e.g., "We're considering a sensor network for our irrigation system"). The agent responds with synthesized guidance citing real cases inline — each citation shows the resource type, technology category, and whether the outcome was positive, mixed, or negative.

The agent is designed to navigate, not prescribe. It won't tell you what to do; it will show you what others did, what happened, and what governance conditions shaped the result.

## What's in v1

- Chat interface with streaming responses
- Case-grounded guidance with inline citations
- Per-message feedback (thumbs up/down) logged for evaluation
- Full LLM observability via Langfuse

Out of scope for v1: user accounts, case browsing, vector search, multi-stakeholder role-based views, community features.

---

## Technical overview

### Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript |
| UI | MUI v6 + Tailwind CSS |
| Agent | Vercel AI SDK + Google Gemini 2.5 Flash |
| Database | Supabase (PostgreSQL) |
| Observability | Langfuse Cloud |
| Hosting | Vercel |

### How the agent works

All cases are loaded from Supabase into the system prompt on each request (context-stuffing). At v1 scale (20–30 cases), this is simpler and more reliable than vector search. The agent is instructed to cite cases using a structured marker format that the frontend parses into visual citation cards.

### Key design decisions

- **No vector embeddings in v1.** Gemini's large context window handles the full case database without semantic search infrastructure.
- **Provider-agnostic LLM layer.** Vercel AI SDK abstracts the model. Switching from Gemini to Claude is a one-line change.
- **Observability from day one.** Every request opens a Langfuse trace. Feedback scores and citation validity checks are logged per response, enabling structured evaluation from the first partner session.
- **RLS on the database.** The anon key used by the frontend can only SELECT. No writes are possible without service-role credentials.

### Local setup

```bash
git clone https://github.com/scrbe/commons-tech-navigator
cd commons-tech-navigator
npm install
cp .env.local.example .env.local
# Add your Supabase, Gemini, and Langfuse keys to .env.local
npm run dev
```

Required environment variables are documented in `.env.local.example`.
