import { useState, useEffect } from 'react';
import { generateImages } from '../apis/imageGeneration';
import { settingsManager } from '../settings';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [stabilityKey, setStabilityKey] = useState('');
  const [imageProvider, setImageProvider] = useState<'openai' | 'stability'>('stability');
  const [textProvider, setTextProvider] = useState<'openai'>('openai');

  useEffect(() => {
    // Load saved API keys and providers when component mounts
    const loadSettings = async () => {
      try {
        const savedOpenaiKey = await settingsManager.getOpenaiApiKey();
        const savedStabilityKey = await settingsManager.getStabilityApiKey();
        const savedImageProvider = await settingsManager.getImageGenerationProvider();
        const savedTextProvider = await settingsManager.getTextGenerationProvider();
        if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
        if (savedStabilityKey) setStabilityKey(savedStabilityKey);
        setImageProvider(savedImageProvider);
        setTextProvider(savedTextProvider);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save API keys and providers to database
      await settingsManager.setOpenaiApiKey(openaiKey);
      await settingsManager.setStabilityApiKey(stabilityKey);
      await settingsManager.setImageGenerationProvider(imageProvider);
      await settingsManager.setTextGenerationProvider(textProvider);
      
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleTestApi = async (provider: 'openai' | 'stability') => {
    setTestStatus('testing');
    setTestMessage(`Testing ${provider} API connection...`);
    
    try {
      const apiKey = provider === 'openai' ? openaiKey : stabilityKey;
      if (!apiKey) {
        throw new Error(`No ${provider} API key provided`);
      }

      const result = await generateImages({
        prompt: "A simple test image",
        width: 512,
        height: 512,
        outputFormat: 'webp',
      });
      
      if (result && result.length > 0) {
        setTestStatus('success');
        setTestMessage(`${provider} API test successful!`);
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      setTestStatus('error');
      setTestMessage(error instanceof Error ? error.message : 'API test failed');
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Settings
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h6" gutterBottom>
                API Configuration
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Image Generation Provider</InputLabel>
                  <Select
                    value={imageProvider}
                    label="Image Generation Provider"
                    onChange={(e) => setImageProvider(e.target.value as 'openai' | 'stability')}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="stability">Stability AI</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Text Generation Provider</InputLabel>
                  <Select
                    value={textProvider}
                    label="Text Generation Provider"
                    onChange={(e) => setTextProvider(e.target.value as 'openai')}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                  </Select>
                </FormControl>
                <Box>
                  <TextField
                    fullWidth
                    label="OpenAI API Key"
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Enter your OpenAI API key"
                    InputProps={{
                      endAdornment: (
                        <Button
                          onClick={() => handleTestApi('openai')}
                          disabled={testStatus === 'testing' || !openaiKey}
                          size="small"
                        >
                          Test
                        </Button>
                      ),
                    }}
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Stability AI API Key"
                    type="password"
                    value={stabilityKey}
                    onChange={(e) => setStabilityKey(e.target.value)}
                    placeholder="Enter your Stability AI API key"
                    InputProps={{
                      endAdornment: (
                        <Button
                          onClick={() => handleTestApi('stability')}
                          disabled={testStatus === 'testing' || !stabilityKey}
                          size="small"
                        >
                          Test
                        </Button>
                      ),
                    }}
                  />
                </Box>
                {testStatus !== 'idle' && (
                  <Alert severity={testStatus === 'success' ? 'success' : 'error'}>
                    {testMessage}
                  </Alert>
                )}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save Settings
        </Button>
      </DialogActions>
    </Dialog>
  );
} 