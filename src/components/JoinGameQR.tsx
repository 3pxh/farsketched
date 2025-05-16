import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface JoinGameQRProps {
  peerId: string;
  gameName: string;
}

export const JoinGameQR = ({ peerId, gameName }: JoinGameQRProps) => {
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (peerId) {
      const baseUrl = 'http://localhost:8000';
      const url = new URL('clientindex.html', baseUrl);
      url.searchParams.set('room', peerId);
      url.searchParams.set('game', gameName);
      setJoinUrl(url.toString());
    }
  }, [peerId, gameName]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setIsCopied(true);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 3, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        minWidth: 0,
        maxWidth: '100%',
      }}
    >
      <Typography variant="h4" gutterBottom>
        Scan to Join
      </Typography>
      {joinUrl && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Box
            sx={{
              p: 0.5,
              bgcolor: 'white',
              borderRadius: 2,
              display: 'inline-block',
              maxWidth: '100%',
              minWidth: 0,
            }}
          >
            <QRCodeSVG
              value={joinUrl}
              size={256}
              level="H"
              marginSize={4}
            />
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<ContentCopyIcon />}
              onClick={handleCopyLink}
              size="large"
            >
              Copy Link
            </Button>
          </Box>
        </Box>
      )}

      <Snackbar
        open={isCopied}
        autoHideDuration={2000}
        onClose={() => setIsCopied(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          sx={{ 
            bgcolor: '#00c853',
            color: 'white',
            '& .MuiAlert-icon': {
              display: 'none'
            }
          }}
        >
          Link copied to clipboard!
        </Alert>
      </Snackbar>
    </Paper>
  );
}; 