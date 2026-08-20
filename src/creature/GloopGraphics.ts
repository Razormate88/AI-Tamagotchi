import { Graphics } from 'pixi.js';
import { CreatureAnimationState, CreatureColors } from './creatureTypes';

/**
 * Draws the procedural Gloop placeholder graphics using PixiJS 8 vector instructions.
 */
export function drawGloop(
  g: Graphics,
  colors: CreatureColors,
  anim: CreatureAnimationState
): void {
  g.clear();

  const eyeScale = Math.max(0.05, anim.eyeScaleY);

  // 1. Soft ground contact shadow
  g.ellipse(0, 48, 46, 14).fill({ color: 0x000000, alpha: 0.12 });

  // 2. Outer aura / subtle glow
  g.ellipse(0, 2, 58, 52).fill({ color: colors.secondary, alpha: 0.3 });

  // 3. Main jelly body
  // Lower body mass
  g.ellipse(0, 8, 54, 46).fill({ color: colors.primary, alpha: 1 });
  // Upper dome
  g.ellipse(0, -10, 44, 40).fill({ color: colors.primary, alpha: 1 });

  // 4. Glossy highlight sheen on top-left
  g.ellipse(-16, -22, 14, 8).fill({ color: colors.highlight, alpha: 0.45 });
  g.circle(-22, -18, 4).fill({ color: colors.highlight, alpha: 0.35 });

  // 5. Blushing cheeks
  g.ellipse(-28, 12, 9, 6).fill({ color: colors.cheeks, alpha: 0.55 });
  g.ellipse(28, 12, 9, 6).fill({ color: colors.cheeks, alpha: 0.55 });

  // 6. Left Eye
  const leftEyeX = -18;
  const leftEyeY = -4;
  // Sclera (white)
  g.ellipse(leftEyeX, leftEyeY, 9, 12 * eyeScale).fill({ color: 0xffffff, alpha: 1 });
  if (eyeScale > 0.3) {
    // Pupil
    g.circle(
      leftEyeX + anim.pupilOffsetX,
      leftEyeY + anim.pupilOffsetY,
      5.5 * eyeScale
    ).fill({ color: colors.eyes, alpha: 1 });
    // Eye shine / spark
    g.circle(
      leftEyeX + anim.pupilOffsetX - 2,
      leftEyeY + anim.pupilOffsetY - 2.5,
      2.5 * eyeScale
    ).fill({ color: 0xffffff, alpha: 1 });
    g.circle(
      leftEyeX + anim.pupilOffsetX + 2,
      leftEyeY + anim.pupilOffsetY + 2,
      1.2 * eyeScale
    ).fill({ color: 0xffffff, alpha: 0.8 });
  }

  // 7. Right Eye
  const rightEyeX = 18;
  const rightEyeY = -4;
  // Sclera (white)
  g.ellipse(rightEyeX, rightEyeY, 9, 12 * eyeScale).fill({ color: 0xffffff, alpha: 1 });
  if (eyeScale > 0.3) {
    // Pupil
    g.circle(
      rightEyeX + anim.pupilOffsetX,
      rightEyeY + anim.pupilOffsetY,
      5.5 * eyeScale
    ).fill({ color: colors.eyes, alpha: 1 });
    // Eye shine / spark
    g.circle(
      rightEyeX + anim.pupilOffsetX - 2,
      rightEyeY + anim.pupilOffsetY - 2.5,
      2.5 * eyeScale
    ).fill({ color: 0xffffff, alpha: 1 });
    g.circle(
      rightEyeX + anim.pupilOffsetX + 2,
      rightEyeY + anim.pupilOffsetY + 2,
      1.2 * eyeScale
    ).fill({ color: 0xffffff, alpha: 0.8 });
  }

  // 8. Cheerful Mouth
  if (anim.isHovered) {
    // Excited open mouth when hovered
    g.moveTo(-7, 10)
      .bezierCurveTo(-7, 20, 7, 20, 7, 10)
      .fill({ color: 0x2d3436, alpha: 1 });
    // Tongue
    g.ellipse(0, 16, 4, 3).fill({ color: 0xff7675, alpha: 1 });
  } else {
    // Sweet smile arc
    g.moveTo(-8, 11)
      .quadraticCurveTo(0, 18, 8, 11)
      .stroke({ width: 3, color: colors.eyes, cap: 'round' });
  }
}
