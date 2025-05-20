import React from 'react';
import { Box, Typography } from '@mui/material';
import EndCredits from '../EndCredits';

const sampleCredits = [
  { role: "Game Design", name: "grg" },
  { role: "Development", name: "grg + bjamin" },
  { role: "Design", name: "bjamin" },
  { role: "Sound Design", name: "bonk" },
  { role: "Testing", name: "The Farsketched Community" }
];

const sampleHighlights = [
  <Typography variant="h6" sx={{ color: 'black' }}>
    woo
  </Typography>,
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