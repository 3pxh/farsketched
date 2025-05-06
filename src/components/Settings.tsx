import { useState, useEffect } from 'react';
import { GameConfig } from '../types';
import { generateImages } from '../apis/imageGeneration';
import { settingsManager } from '../settings';

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
      onSave(config);
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
        outputFormat: 'webp'
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
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="settings-section">
            <h3>API Configuration</h3>
            <div className="form-group">
              <label htmlFor="openaiKey">OpenAI API Key:</label>
              <div className="api-key-input">
                <input
                  type="password"
                  id="openaiKey"
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder="Enter your OpenAI API key"
                />
                <button
                  type="button"
                  className="test-button"
                  onClick={() => handleTestApi('openai')}
                  disabled={testStatus === 'testing' || !openaiKey}
                >
                  Test
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="stabilityKey">Stability AI API Key:</label>
              <div className="api-key-input">
                <input
                  type="password"
                  id="stabilityKey"
                  value={stabilityKey}
                  onChange={(e) => setStabilityKey(e.target.value)}
                  placeholder="Enter your Stability AI API key"
                />
                <button
                  type="button"
                  className="test-button"
                  onClick={() => handleTestApi('stability')}
                  disabled={testStatus === 'testing' || !stabilityKey}
                >
                  Test
                </button>
              </div>
            </div>
            {testStatus !== 'idle' && (
              <div className={`test-status ${testStatus}`}>
                {testMessage}
              </div>
            )}
          </div>
          <div className="settings-section">
            <h3>Game Settings</h3>
            <div className="form-group">
              <label htmlFor="maxPlayers">Max Players:</label>
              <input
                type="number"
                id="maxPlayers"
                value={config.maxPlayers}
                onChange={(e) => setConfig({ ...config, maxPlayers: parseInt(e.target.value) })}
                min="2"
                max="20"
              />
            </div>
            <div className="form-group">
              <label htmlFor="roundCount">Number of Rounds:</label>
              <input
                type="number"
                id="roundCount"
                value={config.roundCount}
                onChange={(e) => setConfig({ ...config, roundCount: parseInt(e.target.value) })}
                min="1"
                max="10"
              />
            </div>
          </div>
          <div className="settings-actions">
            <button type="submit" className="save-button">Save Settings</button>
          </div>
        </form>
      </div>
    </div>
  );
} 