import React from 'react';
import { Box, Typography } from '@mui/material';
import EndCredits from '../EndCredits';

const sampleCredits = [
  { role: "Game Design", name: "Alex Chen" },
  { role: "Development", name: "Sarah Johnson" },
  { role: "Art Direction", name: "Marcus Wong" },
  { role: "Sound Design", name: "Emma Rodriguez" },
  { role: "Testing", name: "The Farsketched Community" }
];

const sampleHighlights = [
  <Typography variant="h6" sx={{ color: 'white' }}>
    First Victory!
  </Typography>,
  <Typography variant="h6" sx={{ color: 'white' }}>
    Most Creative Drawing: "Abstract Dreams"
  </Typography>,
  <Typography variant="h6" sx={{ color: 'white' }}>
    Best Team Collaboration
  </Typography>,
  <Typography variant="h6" sx={{ color: 'white' }}>
    Fastest Round: 45 seconds
  </Typography>
];

const EndCreditsFixture: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <EndCredits
        credits={sampleCredits}
        highlights={sampleHighlights}
      />
    </Box>
  );
};

export default EndCreditsFixture; 