import React, { useEffect, useState } from 'react';
import { SpeechBubbleState } from '../simulation/model/petState';

interface ReactionBubbleProps {
  trigger: number;
  speech?: SpeechBubbleState | null;
}

const REACTIONS = ['✨', '💖', '♪', '🌸', '⭐', '🎈'];

export const ReactionBubble: React.FC<ReactionBubbleProps> = ({ trigger, speech }) => {
  const [activeEmote, setActiveEmote] = useState<string | null>(null);
  const [emoteKey, setEmoteKey] = useState<number>(0);

  // Click squish reaction burst
  useEffect(() => {
    if (trigger > 0) {
      const randomIcon = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      setActiveEmote(randomIcon);
      setEmoteKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setActiveEmote(null);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="reaction-bubble-layer" aria-hidden="true">
      {activeEmote && (
        <div key={emoteKey} className="pet-reaction-bubble">
          {activeEmote}
        </div>
      )}

      {speech && speech.text && (
        <div
          key={speech.text}
          className={`pet-speech-bubble priority-${speech.priority}`}
        >
          <span className="speech-text">{speech.text}</span>
          <div className="speech-tail" />
        </div>
      )}
    </div>
  );
};
