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
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
        background: 'linear-gradient(to bottom, #f5f5f5, #e0e0e0)',
        overflow: 'hidden',
        color: 'black',
      }}
    >
      <AnimatedContainer onAnimationEnd={handleAnimationEnd}>
        <Container maxWidth="md">
          <Box sx={{ mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                mb: 4,
                color: '#1a237e',
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
                  sx={{ color: '#1a237e', mr: 1, fontWeight: 'bold' }}
                >
                  {credit.role}
                </Typography>
                <Typography component="span">{credit.name}</Typography>
              </Box>
            ))}
          </Box>

          {highlights.length > 0 && <Box sx={{ mb: 8 }}>
            <Typography
              variant="h2"
              sx={{
                mb: 4,
                color: '#1a237e',
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
          </Box>}

          <Box sx={{ mt: 8 }}>
            <Typography
              variant="h5"
              sx={{ color: '#1a237e', fontStyle: 'italic' }}
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