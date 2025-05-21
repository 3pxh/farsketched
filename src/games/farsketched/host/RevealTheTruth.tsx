import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Paper,
} from '@mui/material';

interface RevealTheTruthProps {
  imageUrl: string;
  prompt: string;
  authorName: string;
  authorAvatarUrl: string;
  onComplete: () => void;
}

export function RevealTheTruth({ 
  imageUrl, 
  prompt, 
  authorName, 
  authorAvatarUrl,
  onComplete 
}: RevealTheTruthProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Box sx={{ textAlign: 'center', p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        The Real Prompt
      </Typography>

      <Box
        component={motion.div}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Image */}
        <Box
          component="img"
          src={imageUrl}
          alt={prompt}
          sx={{
            width: '100%',
            maxHeight: '50vh',
            objectFit: 'contain',
            borderRadius: '16px 16px 0 0',
            bgcolor: '#eee',
            boxShadow: 3
          }}
        />

        {/* Prompt */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            maxWidth: 800,
            mx: 'auto',
            bgcolor: 'rgba(255,255,255,0.9)',
            borderRadius: '0 0 16px 16px',
            mt: -1 // Slight overlap to prevent any gap
          }}
        >
          <Avatar
            src={authorAvatarUrl}
            alt={authorName}
            sx={{ width: 48, height: 48, border: '2px solid white', boxShadow: 1 }}
          />
          <Box sx={{ textAlign: 'left' }}>
            <Typography variant="h4" gutterBottom>
              "{prompt}"
            </Typography>
            <Typography variant="h5">
              -{authorName}
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
} 