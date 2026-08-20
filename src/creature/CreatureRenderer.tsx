import React, { useEffect, useRef } from 'react';
import { Application, Graphics, Container } from 'pixi.js';
import { SpeciesIdentity } from '../types/pet';
import { CreatureAnimationState, CreatureColors } from './creatureTypes';
import { drawGloop } from './GloopGraphics';
import { reportStage, reportError } from '../desktop/diagnostics';

interface CreatureRendererProps {
  species: SpeciesIdentity;
  squishTrigger: number;
  isHovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

function parseHex(hex: string | undefined, fallback: number): number {
  if (!hex) return fallback;
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return isNaN(num) ? fallback : num;
}

export const CreatureRenderer: React.FC<CreatureRendererProps> = ({
  species,
  squishTrigger,
  isHovered,
  onHoverChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const animStateRef = useRef<CreatureAnimationState>({
    time: 0,
    blinkTimer: 3.0,
    isBlinking: false,
    eyeScaleY: 1,
    isHovered: false,
    squishOffset: 0,
    squishVelocity: 0,
    pupilOffsetX: 0,
    pupilOffsetY: 0,
  });

  // Sync hover state to ref for animation loop
  useEffect(() => {
    animStateRef.current.isHovered = isHovered;
  }, [isHovered]);

  // Trigger squish bounce on click reaction
  useEffect(() => {
    if (squishTrigger > 0) {
      animStateRef.current.squishVelocity = -8.5; // squash impulse
    }
  }, [squishTrigger]);

  useEffect(() => {
    reportStage('creature_renderer_mounted');
    let isMounted = true;
    let app: Application | null = null;

    const colors: CreatureColors = {
      primary: parseHex(species.visualScaffolding.primaryColor, 0x6c5ce7),
      secondary: parseHex(species.visualScaffolding.secondaryColor, 0xa29bfe),
      eyes: parseHex(species.visualScaffolding.eyeColor, 0x2d3436),
      cheeks: 0xff7675,
      highlight: 0xffffff,
    };

    async function initPixi() {
      if (!canvasRef.current || !containerRef.current) {
        reportError('pixi_init_skipped', 'canvasRef or containerRef is null');
        return;
      }

      try {
        const newApp = new Application();
        await newApp.init({
          canvas: canvasRef.current,
          resizeTo: window,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        if (!isMounted) {
          newApp.destroy(true);
          return;
        }

        app = newApp;
        appRef.current = newApp;

        const creatureContainer = new Container();
        const graphics = new Graphics();
        creatureContainer.addChild(graphics);
        newApp.stage.addChild(creatureContainer);

        const rendererType = (newApp.renderer as unknown as { name?: string })?.name || 'unknown';
        reportStage(
          'pixi_initialized',
          `renderer: ${rendererType}, screen: ${newApp.screen.width}x${newApp.screen.height}, dpr: ${window.devicePixelRatio}`
        );

        newApp.ticker.add((ticker) => {
        const deltaSeconds = Math.min(ticker.deltaMS / 1000, 0.1);
        const anim = animStateRef.current;
        anim.time += deltaSeconds;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Idle breathing & gentle vertical bob
        const bobbing = prefersReducedMotion ? 0 : Math.sin(anim.time * 2.4) * 3.5;
        const breathX = prefersReducedMotion ? 1 : 1 + Math.sin(anim.time * 2.4) * 0.025;
        const breathY = prefersReducedMotion ? 1 : 1 - Math.sin(anim.time * 2.4) * 0.025;

        // Spring physics for click / hover reaction
        const springK = 140;
        const damping = 0.84;
        const force = -anim.squishOffset * springK;
        anim.squishVelocity = (anim.squishVelocity + force * deltaSeconds) * damping;
        anim.squishOffset += anim.squishVelocity * deltaSeconds;

        // Blink countdown timer
        anim.blinkTimer -= deltaSeconds;
        if (anim.blinkTimer <= 0) {
          if (!anim.isBlinking) {
            anim.isBlinking = true;
          }
          const blinkProgress = Math.abs(anim.blinkTimer);
          const blinkDuration = 0.14; // 140ms
          if (blinkProgress >= blinkDuration) {
            anim.isBlinking = false;
            anim.eyeScaleY = 1;
            anim.blinkTimer = 2.5 + Math.random() * 4.0;
          } else {
            const t = blinkProgress / blinkDuration;
            anim.eyeScaleY = Math.abs(Math.sin(t * Math.PI - Math.PI / 2));
          }
        } else {
          anim.eyeScaleY = 1;
        }

        // Hover scale boost
        const hoverScale = anim.isHovered && !prefersReducedMotion ? 1.05 : 1.0;
        const scaleX = (breathX + anim.squishOffset) * hoverScale;
        const scaleY = (breathY - anim.squishOffset) * hoverScale;

        // Responsive position and scaling based on window size
        const screenW = newApp.screen.width;
        const screenH = newApp.screen.height;
        const baseDimension = 220;
        const responsiveFactor = Math.max(0.6, Math.min(screenW, screenH) / baseDimension);

        creatureContainer.position.set(screenW / 2, screenH / 2 + bobbing);
        creatureContainer.scale.set(
          responsiveFactor * scaleX,
          responsiveFactor * scaleY
        );

        // Draw procedural Gloop
        drawGloop(graphics, colors, anim);
      });
    } catch (err) {
      console.error('Pixi initialization failed:', err);
      reportError('pixi_init_failed', err);
    }
  }

  initPixi();

    return () => {
      isMounted = false;
      if (app) {
        app.destroy(true);
        appRef.current = null;
      }
    };
  }, [species]);

  return (
    <div
      ref={containerRef}
      className="creature-canvas-container"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onContextMenu={onContextMenu}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      role="img"
      aria-label={`${species.canonicalName}, your desktop companion`}
      tabIndex={0}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
};
