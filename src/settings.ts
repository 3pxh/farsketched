import { getSetting, setSetting } from './apis/database';

export enum SettingsKey {
  OPENAI_API_KEY = 'openai_api_key',
  STABILITY_API_KEY = 'stability_api_key',
  MAX_PLAYERS = 'max_players',
  MIN_PLAYERS = 'min_players',
  ROUND_COUNT = 'round_count',
  PROMPT_TIMER = 'prompt_timer',
  FOOLING_TIMER = 'fooling_timer',
  GUESSING_TIMER = 'guessing_timer',
  SCORING_TIMER = 'scoring_timer'
}

class SettingsManager {
  private static instance: SettingsManager;
  private cache: Map<SettingsKey, string> = new Map();

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  async getSetting(key: SettingsKey): Promise<string | null> {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key) || null;
    }

    // If not in cache, get from database
    const value = await getSetting(key);
    if (value) {
      this.cache.set(key, value);
    }
    return value;
  }

  async setSetting(key: SettingsKey, value: string): Promise<void> {
    await setSetting(key, value);
    this.cache.set(key, value);
  }

  async getOpenaiApiKey(): Promise<string | null> {
    return this.getSetting(SettingsKey.OPENAI_API_KEY);
  }

  async getStabilityApiKey(): Promise<string | null> {
    return this.getSetting(SettingsKey.STABILITY_API_KEY);
  }

  async setOpenaiApiKey(key: string): Promise<void> {
    await this.setSetting(SettingsKey.OPENAI_API_KEY, key);
  }

  async setStabilityApiKey(key: string): Promise<void> {
    await this.setSetting(SettingsKey.STABILITY_API_KEY, key);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const settingsManager = SettingsManager.getInstance(); 