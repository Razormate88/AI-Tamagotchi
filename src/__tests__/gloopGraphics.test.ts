import { describe, it, expect } from 'vitest';
import { Graphics } from 'pixi.js';
import { drawGloop } from '../creature/GloopGraphics';
import { CreatureAnimationState, CreatureColors } from '../creature/creatureTypes';

describe('GloopGraphics', () => {
  it('draws instructions into Graphics context without error', () => {
    const g = new Graphics();
    const colors: CreatureColors = {
      primary: 0x6c5ce7,
      secondary: 0xa29bfe,
      eyes: 0x2d3436,
      cheeks: 0xff7675,
      highlight: 0xffffff,
    };
    const anim: CreatureAnimationState = {
      time: 0,
      blinkTimer: 3,
      isBlinking: false,
      eyeScaleY: 1,
      isHovered: false,
      squishOffset: 0,
      squishVelocity: 0,
      pupilOffsetX: 0,
      pupilOffsetY: 0,
    };

    drawGloop(g, colors, anim);

    expect(g.context.instructions.length).toBeGreaterThan(0);
    const bounds = g.bounds;
    expect(bounds.width).toBeGreaterThan(50);
    expect(bounds.height).toBeGreaterThan(50);
  });
});
