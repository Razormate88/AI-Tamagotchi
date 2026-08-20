import { useRef, useCallback, MouseEvent as ReactMouseEvent } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ContextMenuPosition } from '../types/desktop';

interface UsePetInteractionOptions {
  onClickPet: () => void;
  onOpenContextMenu: (pos: ContextMenuPosition) => void;
}

const DRAG_THRESHOLD_PX = 5;

/**
 * Handles pointer events to distinguish between a pet click and a native window drag.
 * If movement exceeds DRAG_THRESHOLD_PX while holding primary button, initiates native startDragging.
 * Otherwise, triggering a click upon release.
 */
export function usePetInteraction({ onClickPet, onOpenContextMenu }: UsePetInteractionOptions) {
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only process left click for drag / pet click
    startPosRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current || isDraggingRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= DRAG_THRESHOLD_PX) {
      isDraggingRef.current = true;
      startPosRef.current = null;
      try {
        getCurrentWindow().startDragging();
      } catch (err) {
        console.warn('Native window drag not available:', err);
      }
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;

      if (startPosRef.current && !isDraggingRef.current) {
        // Pointer did not exceed threshold -> valid pet click
        onClickPet();
      }

      startPosRef.current = null;
      isDraggingRef.current = false;
    },
    [onClickPet]
  );

  const handleContextMenu = useCallback(
    (e: ReactMouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onOpenContextMenu({ x: e.clientX, y: e.clientY });
    },
    [onOpenContextMenu]
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onContextMenu: handleContextMenu,
  };
}
