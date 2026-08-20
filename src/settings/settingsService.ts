import { getSetting, setSetting } from '../persistence/settingsRepository';
import { AppSettings, DEFAULT_APP_SETTINGS, PetSizePreset } from '../types/settings';
import { setPetWindowAlwaysOnTop, setAutostartEnabled } from '../desktop/windowControl';
import { applyPetSizePreset } from '../desktop/petSizes';

const SETTINGS_KEY = 'app_preferences';

export class SettingsService {
  private static currentSettings: AppSettings = { ...DEFAULT_APP_SETTINGS };

  /**
   * Loads persisted settings from SQLite, applying defaults where appropriate.
   */
  public static async loadSettings(): Promise<AppSettings> {
    try {
      const persisted = await getSetting<Partial<AppSettings>>(SETTINGS_KEY, {});
      this.currentSettings = {
        ...DEFAULT_APP_SETTINGS,
        ...persisted,
      };
      return { ...this.currentSettings };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { ...this.currentSettings };
    }
  }

  /**
   * Returns current in-memory settings snapshot.
   */
  public static getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  /**
   * Updates always-on-top setting and synchronizes with native window.
   */
  public static async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    await setPetWindowAlwaysOnTop(alwaysOnTop);
    this.currentSettings.alwaysOnTop = alwaysOnTop;
    await setSetting(SETTINGS_KEY, this.currentSettings);
  }

  /**
   * Updates autostart setting and synchronizes with OS autostart plugin.
   */
  public static async setAutostart(autostart: boolean): Promise<void> {
    await setAutostartEnabled(autostart);
    this.currentSettings.autostart = autostart;
    await setSetting(SETTINGS_KEY, this.currentSettings);
  }

  /**
   * Updates pet size preset and resizes native window.
   */
  public static async setPetSizePreset(preset: PetSizePreset): Promise<void> {
    await applyPetSizePreset(preset);
    this.currentSettings.petSizePreset = preset;
    await setSetting(SETTINGS_KEY, this.currentSettings);
  }

  /**
   * Updates sound effects setting.
   */
  public static async setSoundEnabled(soundEnabled: boolean): Promise<void> {
    this.currentSettings.soundEnabled = soundEnabled;
    await setSetting(SETTINGS_KEY, this.currentSettings);
  }
}
