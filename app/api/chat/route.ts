// Chat API route — POST /api/chat
//
// Accepts a messages array from the Vercel AI SDK useChat hook on the frontend.
// Streams a response from Gemini via the Vercel AI SDK.
// Every request is traced in Langfuse: one trace per chat request, one generation
// per agent response. The trace ID is returned in the x-trace-id response header
// so SAN-32 can attach thumbs-up/thumbs-down scores to the correct trace.
//
// Retrieval logic (Supabase case fetch + system prompt construction) is added in SAN-29.
// The system prompt below is a placeholder that will be replaced in SAN-29.

import { streamText, convertToModelMessages } from 'ai';
import { google } from '@ai-sdk/google';
import { Langfuse } from 'langfuse';

// Langfuse client — initialised once at module level.
// Reads LANGFUSE_SECRET_KEY and LANGFUSE_PUBLIC_KEY automatically from environment.
const langfuse = new Langfuse();

// Placeholder system prompt — replaced with the retrieval-augmented prompt in SAN-29.
// The real prompt will include: agent role, case context, citation format contract,
// hallucination guardrails, and depth-prompt instruction.
const SYSTEM_PROMPT =
  'You are the Commons Tech Navigator, an AI agent that helps advisors understand ' +
  'governance risks when introducing technology into common-pool resource management ' +
  'contexts. You ground all guidance in specific cases from your evidence base.';

export async function POST(req: Request) {
  const body = await req.json();

  // convertToModelMessages converts the UI message format sent by useChat on the
  // frontend into the ModelMessage format that streamText expects.
  const modelMessages = await convertToModelMessages(body.messages);

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
    system: SYSTEM_PROMPT,
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
