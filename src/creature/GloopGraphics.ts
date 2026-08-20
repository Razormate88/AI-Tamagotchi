import { Graphics } from 'pixi.js';
import { CreatureAnimationState, CreatureColors } from './creatureTypes';

/**
 * Draws procedural Gloop graphics using PixiJS 8 vector instructions,
 * adapting expressions, eyes, mouth, and indicators dynamically based on mood and animation state.
 */
export function drawGloop(
  g: Graphics,
  colors: CreatureColors,
  anim: CreatureAnimationState
): void {
  g.clear();

  const mood = anim.mood || 'content';
  const isSleeping = mood === 'asleep';
  const eyeScale = isSleeping ? 0.05 : Math.max(0.05, anim.eyeScaleY);

  // 1. Ground contact shadow (fades when bouncing high)
  const shadowAlpha = Math.max(0.04, 0.12 - anim.squishOffset * 0.05);
  g.ellipse(0, 48, 46, 14).fill({ color: 0x000000, alpha: shadowAlpha });

  // 2. Outer aura / subtle glow
  const auraAlpha = mood === 'excited' ? 0.45 : isSleeping ? 0.18 : 0.3;
  g.ellipse(0, 2, 58, 52).fill({ color: colors.secondary, alpha: auraAlpha });

  // 3. Main jelly body
  // Lower body mass
  g.ellipse(0, 8, 54, 46).fill({ color: colors.primary, alpha: 1 });
  // Upper dome
  g.ellipse(0, -10, 44, 40).fill({ color: colors.primary, alpha: 1 });

  // 4. Glossy highlight sheen on top-left
  g.ellipse(-16, -22, 14, 8).fill({ color: colors.highlight, alpha: 0.45 });
  g.circle(-22, -18, 4).fill({ color: colors.highlight, alpha: 0.35 });

  // 5. Blushing cheeks
  const cheekAlpha = (mood === 'happy' || mood === 'excited') ? 0.75 : mood === 'lonely' ? 0.3 : 0.55;
  g.ellipse(-28, 12, 9, 6).fill({ color: colors.cheeks, alpha: cheekAlpha });
  g.ellipse(28, 12, 9, 6).fill({ color: colors.cheeks, alpha: cheekAlpha });

  // 6. Eyes
  const leftEyeX = -18;
  const rightEyeX = 18;
  const eyeY = -4;

  if (isSleeping) {
    // Sleeping closed eyes: gentle peaceful curved lines ⌒  ⌒
    g.moveTo(leftEyeX - 7, eyeY + 2)
      .quadraticCurveTo(leftEyeX, eyeY - 4, leftEyeX + 7, eyeY + 2)
      .stroke({ width: 2.8, color: colors.eyes, cap: 'round' });

    g.moveTo(rightEyeX - 7, eyeY + 2)
      .quadraticCurveTo(rightEyeX, eyeY - 4, rightEyeX + 7, eyeY + 2)
      .stroke({ width: 2.8, color: colors.eyes, cap: 'round' });

    // Floating Zzz particle indicators
    const zCycle = (anim.time * 0.8) % 3;
    for (let i = 0; i < 2; i++) {
      const zOffset = (zCycle + i * 1.5) % 3;
      const zX = 22 + zOffset * 8;
      const zY = -24 - zOffset * 14;
      const zAlpha = Math.max(0, Math.sin((zOffset / 3) * Math.PI) * 0.85);
      const zSize = 5 + zOffset * 2.5;

      if (zAlpha > 0.05) {
        // Draw small procedural 'Z'
        g.moveTo(zX - zSize / 2, zY - zSize / 2)
          .lineTo(zX + zSize / 2, zY - zSize / 2)
          .lineTo(zX - zSize / 2, zY + zSize / 2)
          .lineTo(zX + zSize / 2, zY + zSize / 2)
          .stroke({ width: 2, color: colors.secondary, alpha: zAlpha, cap: 'round' });
      }
    }
  } else {
    // Awake eye drawing
    let effectiveEyeScale = eyeScale;
    let pOffsetX = anim.pupilOffsetX;
    let pOffsetY = anim.pupilOffsetY;

    if (mood === 'tired') {
      effectiveEyeScale *= 0.55; // Drooping sleepy eyes
    } else if (mood === 'bored') {
      effectiveEyeScale *= 0.75;
      pOffsetX += 3.5; // Looking off to the side
    } else if (mood === 'hungry' || mood === 'lonely') {
      pOffsetY += 2.0; // Looking down wistfully
    } else if (mood === 'grumpy') {
      effectiveEyeScale *= 0.65;
    }

    // Left eye sclera
    g.ellipse(leftEyeX, eyeY, 9, 12 * effectiveEyeScale).fill({ color: 0xffffff, alpha: 1 });
    // Right eye sclera
    g.ellipse(rightEyeX, eyeY, 9, 12 * effectiveEyeScale).fill({ color: 0xffffff, alpha: 1 });

    if (effectiveEyeScale > 0.25) {
      // Pupils
      g.circle(leftEyeX + pOffsetX, eyeY + pOffsetY, 5.5 * effectiveEyeScale).fill({ color: colors.eyes, alpha: 1 });
      g.circle(rightEyeX + pOffsetX, eyeY + pOffsetY, 5.5 * effectiveEyeScale).fill({ color: colors.eyes, alpha: 1 });

      // Highlights
      g.circle(leftEyeX + pOffsetX - 2, eyeY + pOffsetY - 2.5, 2.5 * effectiveEyeScale).fill({ color: 0xffffff, alpha: 1 });
      g.circle(rightEyeX + pOffsetX - 2, eyeY + pOffsetY - 2.5, 2.5 * effectiveEyeScale).fill({ color: 0xffffff, alpha: 1 });

      if (mood === 'excited' || mood === 'happy') {
        // Extra sparkle in eyes for excited/happy mood
        g.circle(leftEyeX + pOffsetX + 2, eyeY + pOffsetY + 2, 1.4 * effectiveEyeScale).fill({ color: 0xffffff, alpha: 0.9 });
        g.circle(rightEyeX + pOffsetX + 2, eyeY + pOffsetY + 2, 1.4 * effectiveEyeScale).fill({ color: 0xffffff, alpha: 0.9 });
      }
    }

    // Grumpy furrowed brow accents
    if (mood === 'grumpy') {
      g.moveTo(leftEyeX - 6, eyeY - 10)
        .lineTo(leftEyeX + 6, eyeY - 7)
        .stroke({ width: 2.2, color: colors.eyes, cap: 'round' });
      g.moveTo(rightEyeX + 6, eyeY - 10)
        .lineTo(rightEyeX - 6, eyeY - 7)
        .stroke({ width: 2.2, color: colors.eyes, cap: 'round' });
    }
  }

  // 7. Mouth
  if (isSleeping) {
    // Sleeping mouth: tiny sweet dot or tiny relaxed line
    g.circle(0, 12, 1.8).fill({ color: colors.eyes, alpha: 0.7 });
  } else if (anim.isHovered || mood === 'excited') {
    // Excited open mouth with tongue
    g.moveTo(-7, 10)
      .bezierCurveTo(-7, 21, 7, 21, 7, 10)
      .fill({ color: 0x2d3436, alpha: 1 });
    // Tongue
    g.ellipse(0, 17, 4, 3).fill({ color: 0xff7675, alpha: 1 });
  } else if (mood === 'happy') {
    // Bigger happy smile arc
    g.moveTo(-9, 10)
      .quadraticCurveTo(0, 19, 9, 10)
      .stroke({ width: 3.2, color: colors.eyes, cap: 'round' });
  } else if (mood === 'hungry' || mood === 'lonely') {
    // Subdued/worried slight downward mouth arc
    g.moveTo(-6, 15)
      .quadraticCurveTo(0, 11, 6, 15)
      .stroke({ width: 2.6, color: colors.eyes, cap: 'round' });
  } else if (mood === 'grumpy') {
    // Annoyed small frown
    g.moveTo(-7, 16)
      .quadraticCurveTo(0, 12, 7, 16)
      .stroke({ width: 3, color: colors.eyes, cap: 'round' });
  } else if (mood === 'bored') {
    // Flat line mouth
    g.moveTo(-6, 14)
      .lineTo(6, 14)
      .stroke({ width: 2.5, color: colors.eyes, cap: 'round' });
  } else if (mood === 'tired') {
    // Small sleepy soft curve
    g.moveTo(-4, 13)
      .quadraticCurveTo(0, 15, 4, 13)
      .stroke({ width: 2.4, color: colors.eyes, cap: 'round' });
  } else {
    // Classic content smile arc
    g.moveTo(-8, 11)
      .quadraticCurveTo(0, 18, 8, 11)
      .stroke({ width: 3, color: colors.eyes, cap: 'round' });
  }
}
