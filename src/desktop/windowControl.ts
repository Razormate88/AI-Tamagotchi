import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';
import {
  enable as enableAutostart,
  disable as disableAutostart,
  isEnabled as isAutostartEnabledPlugin,
} from '@tauri-apps/plugin-autostart';

/**
 * Checks whether the main pet window is always on top.
 */
export async function getPetWindowAlwaysOnTop(): Promise<boolean> {
  try {
    return await invoke<boolean>('get_pet_always_on_top');
  } catch (error) {
    console.error('Failed to get always-on-top status:', error);
    return false;
  }
}

/**
 * Sets the main pet window always-on-top state.
 */
export async function setPetWindowAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
  try {
    await invoke('set_pet_always_on_top', { alwaysOnTop });
  } catch (error) {
    console.error('Failed to set always-on-top:', error);
    throw error;
  }
}

/**
 * Opens and positions the companion menu popup window adjacent to Gloop.
 */
export async function openCompanionMenu(clickX?: number, clickY?: number): Promise<void> {
  try {
    await invoke('open_companion_menu', {
      clickX: clickX ?? null,
      clickY: clickY ?? null,
    });
  } catch (error) {
    console.error('Failed to open companion menu:', error);
  }
}

/**
 * Toggles visibility of the companion menu popup window.
 */
export async function toggleCompanionMenu(clickX?: number, clickY?: number): Promise<void> {
  try {
    await invoke('toggle_companion_menu', {
      clickX: clickX ?? null,
      clickY: clickY ?? null,
    });
  } catch (error) {
    console.error('Failed to toggle companion menu:', error);
  }
}

/**
 * Hides the companion menu popup window.
 */
export async function hideCompanionMenu(): Promise<void> {
  try {
    await invoke('hide_companion_menu');
  } catch (error) {
    console.error('Failed to hide companion menu:', error);
  }
}

/**
 * Sets the main pet window dimensions.
 */
export async function setPetWindowSize(width: number, height: number): Promise<void> {
  try {
    await invoke('set_pet_size', { width, height });
  } catch (error) {
    console.error('Failed to set pet window size:', error);
  }
}

/**
 * Hides the companion pet window and popup menu (can be reopened via tray).
 */
export async function hidePetWindow(): Promise<void> {
  try {
    await invoke('hide_pet');
  } catch (error) {
    console.error('Failed to hide window:', error);
  }
}

/**
 * Authoritatively shows, unminimizes, verifies geometry, and focuses the companion pet window.
 */
export async function showPetWindow(): Promise<void> {
  try {
    await invoke('show_pet');
  } catch (error) {
    console.error('Failed to invoke show_pet command:', error);
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

/**
 * Listens for companion menu shown events emitted from Rust.
 */
export async function subscribeToCompanionMenuShown(
  onMenuShown: () => void
): Promise<UnlistenFn> {
  return await listen('companion-menu-shown', () => {
    onMenuShown();
  });
}
