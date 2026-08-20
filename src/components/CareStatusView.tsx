import React from 'react';
import { PetMood, PetState } from '../simulation/model/petState';
import { InteractionType } from '../simulation/engine/interactionEngine';
import { SpeciesIdentity } from '../types/pet';

export interface CareStatusViewProps {
  species: SpeciesIdentity;
  petState: PetState | null;
  mood: PetMood;
  onBack: () => void;
  onInteract: (type: InteractionType) => void;
}

const MOOD_META: Record<PetMood, { label: string; icon: string; color: string }> = {
  content: { label: 'Content', icon: '😌', color: '#a29bfe' },
  happy: { label: 'Happy', icon: '😊', color: '#55efc4' },
  excited: { label: 'Excited', icon: '🤩', color: '#ffeaa7' },
  asleep: { label: 'Asleep', icon: '😴', color: '#81ecec' },
  tired: { label: 'Tired', icon: '🥱', color: '#fab1a0' },
  hungry: { label: 'Hungry', icon: '🍖', color: '#ff7675' },
  bored: { label: 'Bored', icon: '😐', color: '#dfe6e9' },
  lonely: { label: 'Lonely', icon: '💔', color: '#fd79a8' },
  grumpy: { label: 'Grumpy', icon: '😠', color: '#d63031' },
};

function formatActivity(activity: string): string {
  switch (activity) {
    case 'idle': return 'Resting quietly';
    case 'look_around': return 'Looking around';
    case 'stretch': return 'Stretching jelly';
    case 'bounce': return 'Bouncing happily';
    case 'hum': return 'Humming a tune';
    case 'daydream': return 'Daydreaming';
    case 'self_play': return 'Entertaining self';
    case 'inspect_something': return 'Inspecting pixels';
    case 'seek_attention': return 'Seeking attention';
    case 'complain_hungry': return 'Wishing for food';
    case 'complain_bored': return 'Looking for fun';
    case 'complain_lonely': return 'Feeling lonely';
    case 'yawn': return 'Yawning drowsily';
    case 'nap': return 'Taking a nap';
    case 'sleep': return 'Deep sleeping';
    case 'wake': return 'Waking up';
    case 'celebrate': return 'Celebrating!';
    case 'sulk': return 'Sulking slightly';
    default: return activity;
  }
}

function getBarColor(value: number): string {
  if (value >= 60) return '#00b894';
  if (value >= 30) return '#fdcb6e';
  return '#ff7675';
}

export const CareStatusView: React.FC<CareStatusViewProps> = ({
  species,
  petState,
  mood,
  onBack,
  onInteract,
}) => {
  const moodInfo = MOOD_META[mood] || MOOD_META.content;
  const isSleeping = petState?.sleepState === 'asleep';

  const satiety = Math.round(petState?.satiety ?? 80);
  const energy = Math.round(petState?.energy ?? 85);
  const fun = Math.round(petState?.fun ?? 75);
  const social = Math.round(petState?.social ?? 75);
  const activity = petState?.currentActivity ?? 'idle';

  return (
    <div className="care-status-card" role="region" aria-label="Care and Status">
      <div className="care-header">
        <button className="care-back-btn" onClick={onBack} aria-label="Back to companion menu">
          ← Back
        </button>
        <span className="care-title">{species.canonicalName} Care</span>
      </div>

      {/* Mood & Activity Header Pill */}
      <div className="care-mood-banner">
        <div className="mood-badge" style={{ borderColor: moodInfo.color }}>
          <span className="mood-icon">{moodInfo.icon}</span>
          <span className="mood-label" style={{ color: moodInfo.color }}>{moodInfo.label}</span>
        </div>
        <div className="activity-label">{formatActivity(activity)}</div>
      </div>

      {/* Need Stat Progress Bars */}
      <div className="need-bars-container">
        <div className="need-stat-row">
          <div className="need-stat-header">
            <span className="need-name">🍗 Satiety</span>
            <span className="need-pct">{satiety}%</span>
          </div>
          <div className="need-track">
            <div
              className="need-fill"
              style={{ width: `${satiety}%`, backgroundColor: getBarColor(satiety) }}
            />
          </div>
        </div>

        <div className="need-stat-row">
          <div className="need-stat-header">
            <span className="need-name">⚡ Energy</span>
            <span className="need-pct">{energy}%</span>
          </div>
          <div className="need-track">
            <div
              className="need-fill"
              style={{ width: `${energy}%`, backgroundColor: getBarColor(energy) }}
            />
          </div>
        </div>

        <div className="need-stat-row">
          <div className="need-stat-header">
            <span className="need-name">🎈 Fun</span>
            <span className="need-pct">{fun}%</span>
          </div>
          <div className="need-track">
            <div
              className="need-fill"
              style={{ width: `${fun}%`, backgroundColor: getBarColor(fun) }}
            />
          </div>
        </div>

        <div className="need-stat-row">
          <div className="need-stat-header">
            <span className="need-name">💖 Social</span>
            <span className="need-pct">{social}%</span>
          </div>
          <div className="need-track">
            <div
              className="need-fill"
              style={{ width: `${social}%`, backgroundColor: getBarColor(social) }}
            />
          </div>
        </div>
      </div>

      <div className="menu-divider" style={{ margin: '8px 0 6px' }} />

      {/* Care Action Buttons Grid */}
      <div className="care-actions-grid">
        <button
          className="care-action-btn"
          onClick={() => onInteract('feed')}
          title="Feed a snack"
        >
          <span className="care-btn-icon">🍗</span>
          <span className="care-btn-label">Feed</span>
        </button>

        <button
          className="care-action-btn"
          onClick={() => onInteract('pet')}
          title="Give gentle pets"
        >
          <span className="care-btn-icon">💖</span>
          <span className="care-btn-label">Pet</span>
        </button>

        <button
          className="care-action-btn"
          onClick={() => onInteract('play')}
          title="Play a game"
        >
          <span className="care-btn-icon">🎾</span>
          <span className="care-btn-label">Play</span>
        </button>

        <button
          className="care-action-btn"
          onClick={() => onInteract('poke')}
          title="Poke gently"
        >
          <span className="care-btn-icon">👉</span>
          <span className="care-btn-label">Poke</span>
        </button>

        <button
          className="care-action-btn care-btn-span"
          onClick={() => onInteract(isSleeping ? 'wake' : 'sleep')}
          title={isSleeping ? 'Wake Gloop up' : 'Put Gloop to sleep'}
        >
          <span className="care-btn-icon">{isSleeping ? '☀️' : '💤'}</span>
          <span className="care-btn-label">{isSleeping ? 'Wake Up' : 'Sleep'}</span>
        </button>
      </div>
    </div>
  );
};
