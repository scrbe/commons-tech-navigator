import { createTheme } from '@mui/material/styles';

// Design system tokens from ux-direction-core-chat-agent-2026-03-26.md
// and design-vision-2026-03-25.md.
// Do not change these values without Design Director sign-off.
const theme = createTheme({
  palette: {
    background: {
      default: '#FAFAFA', // Full page background
      paper: '#FFFFFF',   // Chat area reading surface
    },
    primary: {
      main: '#2A7F7F', // Teal accent: send button, active feedback icon, card borders
    },
    text: {
      primary: '#1A1A1A',   // Agent response body text
      secondary: '#555555', // Depth prompt, labels
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    body1: {
      fontSize: '15px',
      lineHeight: 1.6,
      color: '#1A1A1A',
    },
    body2: {
      fontSize: '13px',
      lineHeight: 1.5,
      color: '#555555',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
});

export default theme;
