'use client';

// AgentMessage — parses and renders a completed (or streaming) agent response.
//
// Two render modes:
//   streaming  → plain text + blinking cursor (markers may be partially written
//                mid-stream, so parsing is deferred until streaming ends)
//   complete   → parsed segments: prose | citation cards | suggested links
//
// Marker contract (do not change without CTO coordination — parsed by SAN-31,
// emitted by lib/agent.ts SAN-29):
//   [CASE_REF: study_title | resource_type | tech_type | outcome_signal | summary]
//   [SUGGESTED: question text]
//
// Text rendering also handles *italic* syntax to style the depth prompt that
// the LLM emits as "*Want me to go deeper...*" per the system prompt instruction.

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CaseCitationCard from './CaseCitationCard';
import type { CaseCitationCardProps } from './CaseCitationCard';

// ── Segment types ──────────────────────────────────────────────────────────

type TextSegment = { type: 'text'; content: string };
type CitationSegment = { type: 'citation' } & CaseCitationCardProps;
type SuggestedSegment = { type: 'suggested'; question: string };
type Segment = TextSegment | CitationSegment | SuggestedSegment;

// ── Parser ─────────────────────────────────────────────────────────────────

/**
 * Splits an agent response string into an ordered array of segments.
 * Preserves reading order so prose, citation cards, and suggested links
 * can be rendered in the sequence the agent intended.
 */
function parseAgentResponse(text: string): Segment[] {
  // New regex instance per call — avoids shared lastIndex state on the global flag.
  const markerRegex = /\[CASE_REF: ([^\]]+)\]|\[SUGGESTED: ([^\]]+)\]/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = markerRegex.exec(text)) !== null) {
    // Text before this marker
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      // CASE_REF — pipe-delimited: title | resource_type | tech_type | outcome_signal | summary
      const [title = '', resourceType = '', techType = '', rawSignal = '', summary = ''] = match[1]
        .split('|')
        .map((s) => s.trim());

      // Normalise outcome_signal — fall back to 'mixed' if LLM emits an unexpected value.
      const outcomeSignal =
        rawSignal === 'positive' || rawSignal === 'negative' ? rawSignal : 'mixed';

      segments.push({ type: 'citation', title, resourceType, techType, outcomeSignal, summary });
    } else if (match[2] !== undefined) {
      // SUGGESTED — plain question text
      segments.push({ type: 'suggested', question: match[2].trim() });
    }

    lastIndex = markerRegex.lastIndex;
  }

  // Remaining text after the last marker (or the full text if no markers found)
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return segments;
}

// ── Italic renderer ────────────────────────────────────────────────────────

/**
 * Converts *text* patterns to italic secondary-color spans.
 * Handles the depth prompt line ("*Want me to go deeper...*") without
 * bringing in a full markdown parser.
 */
function renderTextWithItalics(text: string): React.ReactNode {
  const parts = text.split(/(\*[^*\n]+\*)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
          return (
            <Box component="span" key={i} sx={{ fontStyle: 'italic', color: '#555555' }}>
              {part.slice(1, -1)}
            </Box>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

type Props = {
  text: string;
  /** True while this specific message is actively streaming. */
  isStreaming: boolean;
  /** Called when a [SUGGESTED:] link is clicked — populates the chat input. */
  onSuggestedClick: (question: string) => void;
};

export default function AgentMessage({ text, isStreaming, onSuggestedClick }: Props) {
  // Streaming mode: render plain text + blinking cursor.
  // Parsing is deferred because markers may be partially written mid-stream.
  if (isStreaming) {
    return (
      <Typography
        sx={{ fontSize: '15px', color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
      >
        {text}
        <Box
          component="span"
          sx={{
            display: 'inline-block',
            width: '2px',
            height: '1em',
            backgroundColor: 'text.primary',
            ml: '1px',
            verticalAlign: 'text-bottom',
            animation: 'blink 1s step-end infinite',
            '@keyframes blink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0 },
            },
          }}
        />
      </Typography>
    );
  }

  // Complete mode: parse and render segments in reading order.
  const segments = parseAgentResponse(text);

  return (
    <Box>
      {segments.map((segment, i) => {
        if (segment.type === 'text') {
          return (
            <Typography
              key={i}
              component="div"
              sx={{
                fontSize: '15px',
                color: 'text.primary',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}
            >
              {renderTextWithItalics(segment.content)}
            </Typography>
          );
        }

        if (segment.type === 'citation') {
          return (
            <CaseCitationCard
              key={i}
              title={segment.title}
              resourceType={segment.resourceType}
              techType={segment.techType}
              outcomeSignal={segment.outcomeSignal}
              summary={segment.summary}
            />
          );
        }

        if (segment.type === 'suggested') {
          // Renders as an inline plain text link that populates the input on click.
          // Does not auto-submit — user can review and edit before sending.
          return (
            <Box
              key={i}
              component="span"
              onClick={() => onSuggestedClick(segment.question)}
              sx={{
                display: 'inline',
                color: '#2A7F7F',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '15px',
                lineHeight: 1.6,
                '&:hover': { color: '#1E5F5F' },
              }}
            >
              {segment.question}
            </Box>
          );
        }

        return null;
      })}
    </Box>
  );
}
