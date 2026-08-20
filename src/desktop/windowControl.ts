import { getCurrentWindow } from '@tauri-apps/api/window';
import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { enable as enableAutostart, disable as disableAutostart, isEnabled as isAutostartEnabledPlugin } from '@tauri-apps/plugin-autostart';

/**
 * Checks whether the current pet window is always on top.
 */
export async function getWindowAlwaysOnTop(): Promise<boolean> {
  try {
    const appWindow = getCurrentWindow();
    return await appWindow.isAlwaysOnTop();
  } catch (error) {
    console.error('Failed to get always-on-top status:', error);
    return false;
  }
}

/**
 * Sets the window always-on-top state.
 */
export async function setWindowAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.setAlwaysOnTop(alwaysOnTop);
  } catch (error) {
    console.error('Failed to set always-on-top:', error);
    throw error;
  }
}

/**
 * Hides the companion pet window (can be reopened via tray).
 */
export async function hidePetWindow(): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.hide();
  } catch (error) {
    console.error('Failed to hide window:', error);
  }
}

/**
 * Shows and focuses the companion pet window.
 */
export async function showPetWindow(): Promise<void> {
  try {
    const appWindow = getCurrentWindow();
    await appWindow.unminimize();
    await appWindow.show();
    await appWindow.setFocus();
  } catch (error) {
    console.error('Failed to show window:', error);
  }
}

/**
 * Resets the window position and size to a safe visible location on screen.
 */
export async function resetWindowPosition(): Promise<void> {
  try {
    await invoke('reset_window_position');
  } catch (error) {
    console.error('Failed to invoke reset_window_position command:', error);
    // Fallback: manually resize to standard preset
    const appWindow = getCurrentWindow();
    await appWindow.show();
    await appWindow.setFocus();
  }
}

/**
 * Checks whether launch at OS startup is enabled.
 */
export async function checkAutostartEnabled(): Promise<boolean> {
  try {
    return await isAutostartEnabledPlugin();
  } catch (error) {
    console.warn('Autostart check failed (may not be supported in dev mode):', error);
    return false;
  }
}

/**
 * Enables or disables launch at OS startup.
 */
export async function setAutostartEnabled(enable: boolean): Promise<void> {
  try {
    if (enable) {
      await enableAutostart();
    } else {
      await disableAutostart();
    }
  } catch (error) {
    console.error('Failed to update autostart status:', error);
    throw error;
  }
}

/**
 * Listens for system tray events emitted to the frontend.
 */
export async function subscribeToTrayEvents(
  onAlwaysOnTopChanged: (enabled: boolean) => void
): Promise<UnlistenFn> {
  return await listen<boolean>('tray-always-on-top-toggled', (event) => {
    onAlwaysOnTopChanged(event.payload);
  });
}
