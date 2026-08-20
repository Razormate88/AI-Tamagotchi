import React, { useEffect, useState } from 'react';

interface ReactionBubbleProps {
  trigger: number;
}

const REACTIONS = ['✨', '💖', '♪', '🌸', '⭐', '🎈'];

export const ReactionBubble: React.FC<ReactionBubbleProps> = ({ trigger }) => {
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [key, setKey] = useState<number>(0);

  useEffect(() => {
    if (trigger > 0) {
      const randomIcon = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      setActiveReaction(randomIcon);
      setKey((prev) => prev + 1);

      const timer = setTimeout(() => {
        setActiveReaction(null);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [trigger]);

  if (!activeReaction) return null;

  return (
    <div key={key} className="pet-reaction-bubble" aria-hidden="true">
      {activeReaction}
    </div>
  );
};
