// Feedback API route — POST /api/feedback
//
// Receives a traceId and score from the frontend (SAN-32) and logs a Langfuse
// score against the corresponding chat trace. The traceId comes from the
// x-trace-id header returned by /api/chat on every request.
//
// Score values: 1 = thumbs up, 0 = thumbs down.
// Score name: 'user-feedback' — consistent key for Langfuse dashboard filtering.
//
// No Supabase write — rating is observability data, not product data.

import { Langfuse } from 'langfuse';

const langfuse = new Langfuse();

export async function POST(req: Request) {
  const { traceId, score } = (await req.json()) as { traceId: string; score: number };

  langfuse.score({
    traceId,
    name: 'user-feedback',
    value: score,
  });

  // Flush before the serverless function exits.
  await langfuse.flushAsync();

  return new Response(null, { status: 204 });
}
