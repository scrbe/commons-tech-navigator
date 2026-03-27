// Chat API route — POST /api/chat
//
// Accepts a messages array from the Vercel AI SDK useChat hook on the frontend.
// Fetches all cases from Supabase, builds a retrieval-augmented system prompt,
// and streams a response from Gemini via the Vercel AI SDK.
// Every request is traced in Langfuse: one trace per chat request, one generation
// per agent response. The trace ID is returned in the x-trace-id response header
// so SAN-32 can attach thumbs-up/thumbs-down scores to the correct trace.

import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { Langfuse } from 'langfuse';
import { fetchAllCases, buildSystemPrompt } from '@/lib/agent';

// Langfuse client — initialised once at module level.
// Reads LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY automatically from environment.
const langfuse = new Langfuse();

export async function POST(req: Request) {
  const body = await req.json();

  // convertToModelMessages converts the UI message format sent by useChat on the
  // frontend into the ModelMessage format that streamText expects.
  const modelMessages = await convertToModelMessages(body.messages);

  // Fetch all cases from Supabase and build the retrieval-augmented system prompt.
  // v1 retrieval: no pre-filter — all rows passed to the LLM on every request.
  const cases = await fetchAllCases();
  const systemPrompt = buildSystemPrompt(cases);

  // Open a Langfuse trace for this request.
  // Input is the full message history so the trace shows conversation context.
  const trace = langfuse.trace({
    name: 'chat',
    input: modelMessages,
  });

  // Open a generation span inside the trace.
  // This captures model, input, output, and token usage in Langfuse.
  const generation = trace.generation({
    name: 'agent-response',
    model: 'gemini-1.5-flash',
    input: modelMessages,
  });

  const result = streamText({
    model: google('gemini-1.5-flash'),
    system: systemPrompt,
    messages: modelMessages,
    onFinish: async ({ text, usage }) => {
      // Close the generation with output and token usage once streaming completes.
      generation.end({
        output: text,
        usage: {
          input: usage.inputTokens,
          output: usage.outputTokens,
        },
      });
      // Flush ensures the trace is sent to Langfuse before the serverless function exits.
      await langfuse.flushAsync();
    },
  });

  // Return the trace ID in a response header.
  // SAN-32 reads this to associate thumbs-up/thumbs-down ratings with the correct trace.
  return result.toUIMessageStreamResponse({
    headers: { 'x-trace-id': trace.id },
  });
}
