import { useState, useEffect } from 'react';
import { GameConfig } from '../games/farsketched/types';
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
  gameConfig: GameConfig;
  onSave: (config: GameConfig) => void;
  onClose: () => void;
}

export function Settings({ gameConfig, onSave, onClose }: SettingsProps) {
  const [config, setConfig] = useState<GameConfig>(gameConfig);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [stabilityKey, setStabilityKey] = useState('');

  useEffect(() => {
    // Load saved API keys when component mounts
    const loadApiKeys = async () => {
      try {
        const savedOpenaiKey = await settingsManager.getOpenaiApiKey();
        const savedStabilityKey = await settingsManager.getStabilityApiKey();
        if (savedOpenaiKey) setOpenaiKey(savedOpenaiKey);
        if (savedStabilityKey) setStabilityKey(savedStabilityKey);
      } catch (error) {
        console.error('Error loading API keys:', error);
      }
    };
    loadApiKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Save API keys to database
      await settingsManager.setOpenaiApiKey(openaiKey);
      await settingsManager.setStabilityApiKey(stabilityKey);
      
      // Update game config with the appropriate API key based on provider
      const updatedConfig = {
        ...config,
        apiKey: config.apiProvider === 'openai' ? openaiKey : stabilityKey
      };
      
      onSave(updatedConfig);
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
        provider,
        width: 512,
        height: 512,
        outputFormat: 'webp',
        apiKey
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

            <Box>
              <Typography variant="h6" gutterBottom>
                Game Settings
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label="Max Players"
                  type="number"
                  value={config.maxPlayers}
                  onChange={(e) => setConfig({ ...config, maxPlayers: parseInt(e.target.value) })}
                  inputProps={{ min: 2, max: 20 }}
                  fullWidth
                />
                <TextField
                  label="Number of Rounds"
                  type="number"
                  value={config.roundCount}
                  onChange={(e) => setConfig({ ...config, roundCount: parseInt(e.target.value) })}
                  inputProps={{ min: 1, max: 10 }}
                  fullWidth
                />
                <FormControl fullWidth>
                  <InputLabel>API Provider</InputLabel>
                  <Select
                    value={config.apiProvider}
                    label="API Provider"
                    onChange={(e) => setConfig({ ...config, apiProvider: e.target.value as 'openai' | 'stability' })}
                  >
                    <MenuItem value="openai">OpenAI</MenuItem>
                    <MenuItem value="stability">Stability AI</MenuItem>
                  </Select>
                </FormControl>
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