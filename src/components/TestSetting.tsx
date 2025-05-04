import { useState, useEffect } from 'react';
import { getSetting, setSetting } from '../database';

export function TestSetting() {
  const [value, setValue] = useState('');
  const [savedValue, setSavedValue] = useState('');

  useEffect(() => {
    // Load the test setting when component mounts
    const loadSetting = async () => {
      try {
        const setting = await getSetting('test_value');
        if (setting) {
          setSavedValue(setting);
          setValue(setting);
        }
      } catch (error) {
        console.error('Error loading setting:', error);
      }
    };
    loadSetting();
  }, []);

  const handleSave = async () => {
    try {
      await setSetting('test_value', value);
      setSavedValue(value);
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  };

  return (
    <div className="test-setting">
      <h2>Test Setting</h2>
      <div className="setting-form">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter test value"
        />
        <button onClick={handleSave}>Save</button>
      </div>
      {savedValue && (
        <div className="current-value">
          Current value: {savedValue}
        </div>
      )}
    </div>
  );
} 