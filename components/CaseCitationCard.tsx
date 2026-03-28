// CaseCitationCard — renders a single [CASE_REF:] marker as an inline card.
//
// Design spec: design-director-decisions/ux-direction-core-chat-agent-2026-03-26.md
//   — MUI Card variant="outlined", teal left border (#2A7F7F), background #F8FAFA
//   — Case name: bold 14px
//   — Resource type + tech type: MUI Chip size="small" variant="outlined"
//   — Outcome signal: Chip color-coded (positive=success, negative=error, mixed=warning)
//   — One-line summary: 13px text.secondary
//
// Outcome signal is LLM-classified from authority_change_summary +
// tech_contestation_summary — there is no outcome enum in the schema.
// (Contract defined in lib/agent.ts — do not change without CTO coordination.)

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

type OutcomeSignal = 'positive' | 'negative' | 'mixed';

export type CaseCitationCardProps = {
  title: string;
  resourceType: string;
  techType: string;
  outcomeSignal: OutcomeSignal;
  summary: string;
};

const OUTCOME_CHIP_COLOR: Record<OutcomeSignal, 'success' | 'error' | 'warning'> = {
  positive: 'success',
  negative: 'error',
  mixed: 'warning',
};

export default function CaseCitationCard({
  title,
  resourceType,
  techType,
  outcomeSignal,
  summary,
}: CaseCitationCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        ml: 2,
        my: 1.5,
        borderLeft: '3px solid #2A7F7F',
        backgroundColor: '#F8FAFA',
      }}
    >
      <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
        {/* Case name */}
        <Typography sx={{ fontWeight: 700, fontSize: '14px', color: 'text.primary', mb: 0.75 }}>
          {title}
        </Typography>

        {/* Labels row: resource type, tech type, outcome signal */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0.75 }}>
          {resourceType && (
            <Chip label={resourceType} size="small" variant="outlined" sx={{ fontSize: '13px' }} />
          )}
          {techType && (
            <Chip label={techType} size="small" variant="outlined" sx={{ fontSize: '13px' }} />
          )}
          <Chip
            label={outcomeSignal}
            size="small"
            color={OUTCOME_CHIP_COLOR[outcomeSignal]}
            sx={{ fontSize: '13px', textTransform: 'capitalize' }}
          />
        </Box>

        {/* One-line summary */}
        <Typography sx={{ fontSize: '13px', color: 'text.secondary', lineHeight: 1.5 }}>
          {summary}
        </Typography>
      </CardContent>
    </Card>
  );
}
