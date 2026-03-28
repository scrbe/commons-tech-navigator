'use client';

// ChatPage — full chat layout with live streaming.
//
// State:
//   useChat (from @ai-sdk/react) — messages, sendMessage, status
//   inputValue (local) — controlled TextField value
//
// Agent responses are parsed and rendered by AgentMessage (SAN-31):
//   [CASE_REF:] markers → CaseCitationCard components inline
//   [SUGGESTED:] markers → plain text links that populate the input
//
// Thumbs up/down feedback controls are added in SAN-32.

import { useChat } from '@ai-sdk/react';
import { isTextUIPart } from 'ai';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import AgentMessage from './AgentMessage';

// Suggested questions from ux-direction-core-chat-agent-2026-03-26.md (Design Director).
// These are designed prompts that teach the researcher what to ask — not placeholder text.
const SUGGESTED_QUESTIONS = [
  'What governance risks should I anticipate when introducing sensor-based water monitoring in an irrigator community with informal tenure arrangements?',
  'Are there cases where digital data collection undermined collective decision-making in fisheries or forest governance? What went wrong?',
  "We're advising an irrigation collective considering a shared IoT platform. What does the evidence say about technology ownership and control risks in similar settings?",
  'What conditions have allowed technology to strengthen — rather than erode — community governance in CPR contexts? I\'m looking for patterns across cases.',
];

export default function ChatPage() {
  const { messages, sendMessage, status } = useChat();
  const [inputValue, setInputValue] = useState('');
  const threadRef = useRef<HTMLDivElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Only count user/assistant messages — system messages never appear client-side
  // but we filter defensively.
  const visibleMessages = messages.filter((m) => m.role === 'user' || m.role === 'assistant');
  const hasMessages = visibleMessages.length > 0;

  // Scroll thread to bottom whenever messages update or streaming adds new text.
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCardClick = (question: string) => {
    setInputValue(question);
  };

  const handleSubmit = () => {
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue });
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends; Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box
        component="header"
        sx={{
          px: 3,
          py: 1.5,
          borderBottom: '1px solid #E0E0E0',
          backgroundColor: 'background.paper',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ fontWeight: 600, fontSize: '15px', color: 'text.primary' }}>
          Commons Tech Navigator
        </Typography>
      </Box>

      {/* ── Message thread ───────────────────────────────────────────────────
          Scrollable. Max 800px centered. Onboarding cards shown until first
          message. Messages grow downward. */}
      <Box
        ref={threadRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 2,
          py: 3,
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '800px' }}>

          {/* Onboarding cards — hidden permanently after first submission */}
          {!hasMessages && (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                maxWidth: '600px',
                mx: 'auto',
                mt: 4,
              }}
            >
              {SUGGESTED_QUESTIONS.map((question, i) => (
                <Card
                  key={i}
                  variant="outlined"
                  sx={{
                    border: '1px solid #E0E0E0',
                    backgroundColor: 'background.paper',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: 'primary.main' },
                  }}
                >
                  <CardActionArea onClick={() => handleCardClick(question)}>
                    <CardContent sx={{ py: 1.5, px: 2 }}>
                      <Typography sx={{ fontSize: '14px', color: 'text.primary', lineHeight: 1.5 }}>
                        {question}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}

          {/* Message list */}
          {visibleMessages.map((message, index) => {
            // Concatenate all text parts — in v1 there is only one text part per
            // message, but we join defensively.
            const text = message.parts
              .filter(isTextUIPart)
              .map((p) => p.text)
              .join('');

            // Show streaming cursor on the last assistant message while streaming.
            const isStreamingThisMessage =
              status === 'streaming' &&
              message.role === 'assistant' &&
              index === visibleMessages.length - 1;

            if (message.role === 'user') {
              return (
                <Box
                  key={message.id}
                  sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2.5 }}
                >
                  <Box
                    sx={{
                      backgroundColor: '#F0F0F0',
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,
                      maxWidth: '75%',
                    }}
                  >
                    <Typography
                      sx={{ fontSize: '15px', color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                    >
                      {text}
                    </Typography>
                  </Box>
                </Box>
              );
            }

            if (message.role === 'assistant') {
              return (
                <Box key={message.id} sx={{ mb: 3 }}>
                  {/* AgentMessage handles streaming cursor, citation card parsing,
                      and suggested-link rendering (SAN-31). */}
                  <AgentMessage
                    text={text}
                    isStreaming={isStreamingThisMessage}
                    onSuggestedClick={handleCardClick}
                  />
                  {/* Thumbs up/down feedback controls added in SAN-32 */}
                </Box>
              );
            }

            return null;
          })}

          {/* Submitted-but-not-yet-streaming indicator — shows between the user
              message appearing and the first streaming token arriving. */}
          {status === 'submitted' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={14} thickness={5} sx={{ color: 'primary.main' }} />
              <Typography sx={{ fontSize: '13px', color: 'text.secondary' }}>
                Retrieving cases…
              </Typography>
            </Box>
          )}

        </Box>
      </Box>

      {/* ── Chat input ───────────────────────────────────────────────────────
          Pinned to bottom. Disabled while loading to prevent double-sends. */}
      <Box
        sx={{
          borderTop: '1px solid #E0E0E0',
          backgroundColor: 'background.paper',
          px: 2,
          py: 2,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: '800px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            multiline
            maxRows={6}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Describe your CPR project — resource type, technology, community context, geography..."
          />
          <IconButton
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
            sx={{
              mb: 0.5,
              color: inputValue.trim() && !isLoading ? 'primary.main' : 'text.secondary',
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
