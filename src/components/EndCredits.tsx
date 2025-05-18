import React from 'react';
import { Box, Typography, Container, Paper, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

interface Credit {
  role: string;
  name: string;
}

interface EndCreditsProps {
  credits: Credit[];
  highlights: React.ReactNode[];
  onComplete?: () => void;
}

const scrollUp = keyframes`
  0% {
    transform: translateY(100vh);
  }
  100% {
    transform: translateY(-100%);
  }
`;

const AnimatedContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  width: '100%',
  padding: theme.spacing(2),
  animation: `${scrollUp} 30s linear forwards`,
  textAlign: 'center',
}));

const HighlightPaper = styled(Paper)(({ theme }) => ({
  margin: theme.spacing(2, 0),
  padding: theme.spacing(2),
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(5px)',
  borderRadius: theme.spacing(1),
}));

const EndCredits: React.FC<EndCreditsProps> = ({ credits, highlights, onComplete }) => {
  const handleAnimationEnd = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(to bottom, #000000, #1a1a1a)',
        overflow: 'hidden',
        color: 'white',
      }}
    >
      <AnimatedContainer onAnimationEnd={handleAnimationEnd}>
        <Container maxWidth="md">
          <Box sx={{ mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                mb: 4,
                color: 'gold',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Credits
            </Typography>
            {credits.map((credit, index) => (
              <Box key={index} sx={{ my: 2 }}>
                <Typography
                  component="span"
                  sx={{ color: 'gold', mr: 1, fontWeight: 'bold' }}
                >
                  {credit.role}
                </Typography>
                <Typography component="span">{credit.name}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                mb: 4,
                color: 'gold',
                textTransform: 'uppercase',
                letterSpacing: 2,
              }}
            >
              Game Highlights
            </Typography>
            {highlights.map((highlight, index) => (
              <HighlightPaper key={index} elevation={0}>
                {highlight}
              </HighlightPaper>
            ))}
          </Box>

          <Box sx={{ mt: 8 }}>
            <Typography
              variant="h5"
              sx={{ color: 'gold', fontStyle: 'italic' }}
            >
              Thank you for playing!
            </Typography>
          </Box>
        </Container>
      </AnimatedContainer>
    </Box>
  );
};

export default EndCredits; 