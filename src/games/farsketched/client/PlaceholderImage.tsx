import { Box, Typography, CircularProgress } from '@mui/material';

interface PlaceholderImageProps {
  text: string;
  width?: number;
  height?: number;
  showSpinner?: boolean;
}

export function PlaceholderImage({ text, width = 320, height = 320, showSpinner = false }: PlaceholderImageProps) {
  return (
    <Box
      sx={{
        width: width,
        height: height,
        bgcolor: 'grey.300',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed',
        borderColor: '#9e9e9e',
        mb: 2,
        mx: 'auto',
      }}
    >
      {showSpinner && <CircularProgress size={36} sx={{ mb: 2 }} />}
      <Typography variant="h6" color="text.secondary" align="center">
        {text}
      </Typography>
    </Box>
  );
} 