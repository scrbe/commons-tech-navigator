'use client';

// ChatPage is the root UI component for the entire v1 product.
// It owns the page layout (header, scrollable thread, pinned input) and the
// onboarding card state. Streaming and message sending are implemented in SAN-30.
//
// State managed here:
//   inputValue    — controlled value for the chat TextField
//   hasSubmitted  — true after the user's first submission; hides onboarding cards permanently

import { useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';

// Placeholder suggested questions — final copy to be provided by Design Director
// before academic partner session (flagged to Santi in SAN-27 summary).
const SUGGESTED_QUESTIONS = [
  "We're introducing GPS-based monitoring to a community fishery. What governance risks should we anticipate?",
  'A water users association is adopting sensor-based irrigation scheduling. How has technology typically shifted authority in similar cases?',
  'Our project involves a digital marketplace for a forest commons. What contestation patterns have emerged in comparable situations?',
  'A protected area is deploying remote sensing to monitor resource use. What authority dynamics should we expect between the state and local communities?',
];

export default function ChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Populate the input field with a suggested question without auto-submitting,
  // so the user can read and edit before sending.
  const handleCardClick = (question: string) => {
    setInputValue(question);
  };

  // On first submission, permanently hide onboarding cards.
  // Actual message sending and streaming are wired up in SAN-30.
  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    setHasSubmitted(true);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends; Shift+Enter inserts a newline
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
      {/* ── Header ─────────────────────────────────────────────────────────────
          Product name only. No navigation, no user menu, no logo in v1.
          Per UX direction: one line, minimal height. */}
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

      {/* ── Message thread ─────────────────────────────────────────────────────
          Scrollable. Content is max 800px centered to prevent unreadable line
          lengths on wide screens. Message bubbles and agent responses are added
          here in SAN-30. */}
      <Box
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

          {/* Onboarding cards — visible only before first message submission.
              Cards are displayed in a column, max 600px wide, centered in the
              thread area. Each card contains a full suggested question.
              Per UX direction: no carousel, no horizontal scroll on mobile. */}
          {!hasSubmitted && (
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
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
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

        </Box>
      </Box>

      {/* ── Chat input ─────────────────────────────────────────────────────────
          Pinned to bottom, always visible. Max width 800px centered.
          TextField: multiline, maxRows=6, outlined.
          Send button: MUI IconButton with SendIcon, inside the input row.
          Keyboard: Enter sends, Shift+Enter creates newline. */}
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
            placeholder="Describe your CPR project — resource type, technology, community context, geography..."
          />
          <IconButton
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            aria-label="Send message"
            sx={{
              mb: 0.5,
              color: inputValue.trim() ? 'primary.main' : 'text.secondary',
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}
