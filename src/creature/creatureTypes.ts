export interface CreatureColors {
  primary: number;
  secondary: number;
  eyes: number;
  cheeks: number;
  highlight: number;
}

export interface CreatureAnimationState {
  time: number;
  blinkTimer: number;
  isBlinking: boolean;
  eyeScaleY: number;
  isHovered: boolean;
  squishOffset: number;
  squishVelocity: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
}
