import {
  FormattedDreamCard,
  FormattedMemoryCard,
  FormattedPreference,
  FormattedUnlockBadge,
  MindPresentationSnapshot,
  PetHabit,
  PetMemory,
  PetMindState,
  PetPreference,
  PetUnlock,
} from '../model/mindState';
import { SpeciesMindConfig } from '../model/mindConfig';
import { SpeciesMemoriesConfig } from '../model/memoryTemplates';
import { SpeciesSecretsConfig } from '../model/secretDefinitions';
import { deriveBondStage } from '../pure/relationshipEngine';
import { formatTemplate } from '../pure/templateFormatter';

/**
 * Formats a relative timestamp into human-readable text.
 */
export function formatRelativeTime(timestamp: number, now: number): string {
  const diffMs = Math.max(0, now - timestamp);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function getMemoryIcon(memoryType: string, subjectKey: string): string {
  if (memoryType === 'first') return '✨';
  if (memoryType === 'dream') return '🌙';
  if (memoryType === 'conflict') return '👉';
  if (memoryType === 'affection') return '💖';
  if (memoryType === 'absence' || memoryType === 'return') return '🚪';
  if (subjectKey.includes('feed')) return '🍗';
  if (subjectKey.includes('play')) return '🎾';
  if (subjectKey.includes('pet')) return '💖';
  if (subjectKey.includes('sleep')) return '💤';
  return '💭';
}

function formatPreferenceMeta(pref: PetPreference): { label: string; icon: string; description: string } {
  const isPositive = pref.affinity > 10;
  const isNegative = pref.affinity < -10;

  switch (pref.preferenceKey) {
    case 'interaction.feed':
      return {
        label: 'Snacks & Feeding',
        icon: '🍗',
        description: isPositive
          ? 'Loves regular snacks when hungry'
          : isNegative
          ? 'Dislikes being fed when full'
          : 'Neutral about snack timing',
      };
    case 'interaction.pet':
      return {
        label: 'Head Pats',
        icon: '💖',
        description: isPositive
          ? 'Deeply comforted by gentle pets'
          : isNegative
          ? 'Prefers personal space'
          : 'Enjoys occasional pets',
      };
    case 'interaction.play':
      return {
        label: 'Playtime',
        icon: '🎾',
        description: isPositive
          ? 'Loves playful games and bouncing'
          : isNegative
          ? 'Finds excessive play exhausting'
          : 'Enjoys playing when energetic',
      };
    case 'interaction.poke':
      return {
        label: 'Poking',
        icon: '👉',
        description: isNegative
          ? 'Dislikes poke spam'
          : isPositive
          ? 'Enjoys playful squishes'
          : 'Tolerates occasional pokes',
      };
    case 'interaction.sleep':
      return {
        label: 'Naps & Rest',
        icon: '💤',
        description: isPositive ? 'Loves cozy restful naps' : 'Prefers staying awake',
      };
    case 'interaction.wake':
      return {
        label: 'Waking Up',
        icon: '☀️',
        description: isNegative
          ? 'Hates being woken up tired'
          : 'Wakes up cheerful and ready',
      };
    default:
      return {
        label: pref.preferenceKey,
        icon: '⭐',
        description: isPositive ? 'Liked' : isNegative ? 'Disliked' : 'Neutral',
      };
  }
}

/**
 * Builds the complete presentation-safe Mind snapshot for companion UI consumption.
 */
export function buildMindPresentationSnapshot(
  mindState: PetMindState,
  memories: PetMemory[],
  preferences: PetPreference[],
  _habits: PetHabit[],
  unlocks: PetUnlock[],
  mindConfig: SpeciesMindConfig,
  memoryConfig: SpeciesMemoriesConfig,
  secretsConfig: SpeciesSecretsConfig,
  now: number
): MindPresentationSnapshot {
  const bondStage = deriveBondStage(mindState, mindConfig.bondStages);

  // Format preferences (only high-confidence or noticeable preferences)
  const formattedPrefs: FormattedPreference[] = preferences
    .filter((p) => p.confidence >= 0.25 || p.sampleCount >= 2)
    .sort((a, b) => Math.abs(b.affinity) * b.confidence - Math.abs(a.affinity) * a.confidence)
    .slice(0, 6)
    .map((pref) => {
      const meta = formatPreferenceMeta(pref);
      return {
        key: pref.preferenceKey,
        label: meta.label,
        icon: meta.icon,
        affinity: pref.affinity,
        confidence: pref.confidence,
        description: meta.description,
      };
    });

  // Format memory cards
  const formattedMemories: FormattedMemoryCard[] = memories
    .filter((m) => m.id !== undefined)
    .slice(0, 10)
    .map((mem) => {
      let payload: Record<string, any> = {};
      try {
        payload = JSON.parse(mem.payloadJson || '{}');
      } catch {
        payload = {};
      }

      const template = memoryConfig.templates[mem.subjectKey] || mem.subjectKey;
      const description = formatTemplate(template, {
        ...payload,
        count: mem.reinforcementCount || payload.count || 1,
      });

      return {
        id: mem.id!,
        icon: getMemoryIcon(mem.memoryType, mem.subjectKey),
        description,
        relativeTime: formatRelativeTime(mem.lastReinforcedAt || mem.formedAt, now),
        valence: mem.valence,
        isProtected: mem.protected === 1,
        memoryType: mem.memoryType,
        subjectKey: mem.subjectKey,
      };
    });

  // Format dreams
  const formattedDreams: FormattedDreamCard[] = memories
    .filter((m) => m.memoryType === 'dream' && m.id !== undefined)
    .slice(0, 5)
    .map((mem) => {
      let payload: Record<string, any> = {};
      try {
        payload = JSON.parse(mem.payloadJson || '{}');
      } catch {
        payload = {};
      }
      return {
        id: mem.id!,
        text: payload.dreamSummary || 'A strange jelly dream.',
        formedAt: mem.formedAt,
        relativeTime: formatRelativeTime(mem.formedAt, now),
      };
    });

  // Format unlocks
  const secretMap = new Map(secretsConfig.secrets.map((s) => [s.key, s]));
  const formattedUnlocks: FormattedUnlockBadge[] = unlocks.map((u) => {
    const def = secretMap.get(u.unlockKey);
    return {
      key: u.unlockKey,
      name: def?.name || u.unlockKey,
      description: def?.description || 'A secret behavioral milestone.',
      icon: def?.icon || '🌟',
      unlockedAt: u.unlockedAt,
    };
  });

  return {
    petId: mindState.petId,
    bond: {
      stageId: bondStage.id,
      stageName: bondStage.name,
      stageDescription: bondStage.description,
      affection: Math.round(mindState.affection),
      trust: Math.round(mindState.trust),
      familiarity: Math.round(mindState.familiarity),
      annoyance: Math.round(mindState.annoyance),
    },
    personality: {
      curiosity: Math.round(mindState.curiosity),
      playfulness: Math.round(mindState.playfulness),
      affectionateness: Math.round(mindState.affectionateness),
      mischief: Math.round(mindState.mischief),
      independence: Math.round(mindState.independence),
      patience: Math.round(mindState.patience),
    },
    preferences: formattedPrefs,
    memories: formattedMemories,
    dreams: formattedDreams,
    unlocks: formattedUnlocks,
    stats: {
      memoryCount: memories.length,
      dreamCount: memories.filter((m) => m.memoryType === 'dream').length,
      unlockCount: unlocks.length,
      lastProcessedEventId: mindState.processedLifeEventId,
    },
  };
}
