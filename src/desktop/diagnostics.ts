import { invoke } from '@tauri-apps/api/core';

/**
 * Sends a lightweight diagnostic milestone to the Rust backend stdout.
 */
export async function reportStage(stage: string, details?: string): Promise<void> {
  try {
    await invoke('report_frontend_stage', { stage, details: details ?? null });
  } catch (e) {
    console.debug('Failed to report frontend stage:', e);
  }
}

/**
 * Sends a frontend initialization or runtime error to the Rust backend stderr.
 */
export async function reportError(stage: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? `${error.message}\n${error.stack}` : String(error);
  try {
    await invoke('report_frontend_error', { stage, error: message });
  } catch (e) {
    console.error('Failed to report frontend error:', e);
  }
}
