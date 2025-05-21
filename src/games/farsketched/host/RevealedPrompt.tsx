import { motion } from 'framer-motion';
import {
  Box,
  Typography,
  Avatar,
  Stack,
} from '@mui/material';
import { Player } from '../types';

interface RevealedPromptProps {
  prompt: {
    id: string;
    text: string;
    authorId: string;
  };
  author: Player;
  guessers: Player[];
}

export function RevealedPrompt({ prompt, author, guessers }: RevealedPromptProps) {
  return (
    <Box
      component={motion.div}
      layout
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      transition={{ type: 'tween', stiffness: 400, damping: 30 }}
      sx={{ mb: 2 }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'grey.100',
          borderRadius: 2,
          boxShadow: 1,
          p: { xs: 1, md: 1.25 },
          mb: 1,
        }}
      >
        <Avatar
          src={author.avatarUrl}
          alt={author.name}
          sx={{ width: 48, height: 48, border: '2px solid #fff', boxShadow: 1 }}
        />
        <Typography 
          sx={{ 
            flex: 1, 
            mx: 2, 
            fontWeight: 500, 
            fontSize: { xs: '1.2rem', md: '1.5rem' },
          }}
        >
          {prompt.text}
        </Typography>
        <Stack direction="row" spacing={-1} alignItems="center" sx={{ minWidth: 48 }}>
          {guessers.length ? (
            guessers.map((guesser, i) => (
              <Box
                key={guesser.id}
                component={motion.img}
                src={guesser.avatarUrl}
                alt={guesser.name}
                title={guesser.name}
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 20 }}
                sx={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #fff', boxShadow: 1, ml: -1 }}
              />
            ))
          ) : (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                ml: 1, 
                fontSize: '32px', 
                lineHeight: 1, 
                display: 'flex', 
                alignItems: 'center', 
                height: 32 
              }}
            >
              😪
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
} 