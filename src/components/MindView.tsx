import React, { useState } from 'react';
import { MindPresentationSnapshot } from '../mind/model/mindState';
import { SpeciesIdentity } from '../types/pet';

export interface MindViewProps {
  species: SpeciesIdentity;
  mindSnapshot: MindPresentationSnapshot | null;
  onBack: () => void;
  onForgetMemory: (memoryId: number) => void;
  onResetLearnedMind: () => void;
}

export const MindView: React.FC<MindViewProps> = ({
  species,
  mindSnapshot,
  onBack,
  onForgetMemory,
  onResetLearnedMind,
}) => {
  const [activeTab, setActiveTab] = useState<'bond' | 'memories' | 'dreams' | 'settings'>('bond');
  const [confirmingReset, setConfirmingReset] = useState<boolean>(false);

  const bond = mindSnapshot?.bond ?? {
    stageId: 'new_creature',
    stageName: 'New Creature',
    stageDescription: 'Just getting acquainted.',
    affection: 50,
    trust: 50,
    familiarity: 0,
    annoyance: 0,
  };

  const personality = mindSnapshot?.personality ?? {
    curiosity: 75,
    playfulness: 70,
    affectionateness: 65,
    mischief: 45,
    independence: 40,
    patience: 50,
  };

  const preferences = mindSnapshot?.preferences ?? [];
  const memories = mindSnapshot?.memories ?? [];
  const dreams = mindSnapshot?.dreams ?? [];
  const unlocks = mindSnapshot?.unlocks ?? [];

  return (
    <div className="mind-view-card" role="region" aria-label="Gloop's Mind">
      {/* Header */}
      <div className="mind-header">
        <button className="care-back-btn" onClick={onBack} aria-label="Back to companion menu">
          ← Back
        </button>
        <span className="mind-title">{species.canonicalName}'s Mind</span>
        <span className="bond-stage-pill" title={bond.stageDescription}>
          {bond.stageName}
        </span>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="mind-tabs">
        <button
          className={`mind-tab-btn ${activeTab === 'bond' ? 'active' : ''}`}
          onClick={() => setActiveTab('bond')}
        >
          🧠 Feelings
        </button>
        <button
          className={`mind-tab-btn ${activeTab === 'memories' ? 'active' : ''}`}
          onClick={() => setActiveTab('memories')}
        >
          💭 Memories {memories.length > 0 && `(${memories.length})`}
        </button>
        <button
          className={`mind-tab-btn ${activeTab === 'dreams' ? 'active' : ''}`}
          onClick={() => setActiveTab('dreams')}
        >
          🌙 Dreams {dreams.length > 0 && `(${dreams.length})`}
        </button>
        <button
          className={`mind-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Reset
        </button>
      </div>

      {/* Tab: Bond, Feelings, & Personality */}
      {activeTab === 'bond' && (
        <div className="mind-tab-content scrollable-content">
          {/* Relationship Dimensions */}
          <div className="mind-section-header">Bond & Relationship</div>
          <div className="need-bars-container" style={{ margin: '4px 0 10px' }}>
            <div className="need-stat-row">
              <div className="need-stat-header">
                <span className="need-name">💖 Affection</span>
                <span className="need-pct">{bond.affection}%</span>
              </div>
              <div className="need-track">
                <div
                  className="need-fill"
                  style={{ width: `${bond.affection}%`, backgroundColor: '#ff7675' }}
                />
              </div>
            </div>

            <div className="need-stat-row">
              <div className="need-stat-header">
                <span className="need-name">🛡️ Trust</span>
                <span className="need-pct">{bond.trust}%</span>
              </div>
              <div className="need-track">
                <div
                  className="need-fill"
                  style={{ width: `${bond.trust}%`, backgroundColor: '#0984e3' }}
                />
              </div>
            </div>

            <div className="need-stat-row">
              <div className="need-stat-header">
                <span className="need-name">🤝 Familiarity</span>
                <span className="need-pct">{bond.familiarity}%</span>
              </div>
              <div className="need-track">
                <div
                  className="need-fill"
                  style={{ width: `${bond.familiarity}%`, backgroundColor: '#6c5ce7' }}
                />
              </div>
            </div>

            {bond.annoyance > 0 && (
              <div className="need-stat-row">
                <div className="need-stat-header">
                  <span className="need-name">💢 Annoyance</span>
                  <span className="need-pct" style={{ color: '#d63031' }}>{bond.annoyance}%</span>
                </div>
                <div className="need-track">
                  <div
                    className="need-fill"
                    style={{ width: `${bond.annoyance}%`, backgroundColor: '#d63031' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Personality Traits */}
          <div className="mind-section-header">Personality Traits</div>
          <div className="personality-grid">
            <div className="trait-pill">
              <span className="trait-label">Curiosity</span>
              <span className="trait-val">{personality.curiosity}%</span>
            </div>
            <div className="trait-pill">
              <span className="trait-label">Playfulness</span>
              <span className="trait-val">{personality.playfulness}%</span>
            </div>
            <div className="trait-pill">
              <span className="trait-label">Affection</span>
              <span className="trait-val">{personality.affectionateness}%</span>
            </div>
            <div className="trait-pill">
              <span className="trait-label">Mischief</span>
              <span className="trait-val">{personality.mischief}%</span>
            </div>
            <div className="trait-pill">
              <span className="trait-label">Independence</span>
              <span className="trait-val">{personality.independence}%</span>
            </div>
            <div className="trait-pill">
              <span className="trait-label">Patience</span>
              <span className="trait-val">{personality.patience}%</span>
            </div>
          </div>

          {/* Discovered Preferences */}
          {preferences.length > 0 && (
            <>
              <div className="mind-section-header" style={{ marginTop: 10 }}>Discovered Preferences</div>
              <div className="preferences-list">
                {preferences.map((pref) => (
                  <div key={pref.key} className="pref-item">
                    <span className="pref-icon">{pref.icon}</span>
                    <div className="pref-text">
                      <div className="pref-title">{pref.label}</div>
                      <div className="pref-desc">{pref.description}</div>
                    </div>
                    <span
                      className={`pref-affinity-badge ${
                        pref.affinity > 10 ? 'positive' : pref.affinity < -10 ? 'negative' : 'neutral'
                      }`}
                    >
                      {pref.affinity > 10 ? 'Likes' : pref.affinity < -10 ? 'Dislikes' : 'Neutral'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Unlocked Secrets */}
          {unlocks.length > 0 && (
            <>
              <div className="mind-section-header" style={{ marginTop: 10 }}>Discoveries & Secrets</div>
              <div className="unlocks-list">
                {unlocks.map((u) => (
                  <div key={u.key} className="unlock-badge-item">
                    <span className="unlock-icon">{u.icon}</span>
                    <div className="unlock-text">
                      <div className="unlock-name">{u.name}</div>
                      <div className="unlock-desc">{u.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab: Memories */}
      {activeTab === 'memories' && (
        <div className="mind-tab-content scrollable-content">
          {memories.length === 0 ? (
            <div className="empty-mind-notice">
              <span>💭</span>
              <div>No memories formed yet. Spend time interacting with Gloop!</div>
            </div>
          ) : (
            <div className="memories-list">
              {memories.map((mem) => (
                <div key={mem.id} className="memory-card">
                  <div className="memory-card-header">
                    <span className="memory-card-icon">{mem.icon}</span>
                    <span className="memory-card-time">{mem.relativeTime}</span>
                  </div>
                  <div className="memory-card-body">{mem.description}</div>
                  <div className="memory-card-footer">
                    {mem.isProtected && <span className="memory-protected-tag">Protected First</span>}
                    <button
                      className="memory-forget-btn"
                      onClick={() => onForgetMemory(mem.id)}
                      title="Forget this specific memory"
                    >
                      Forget
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Dreams */}
      {activeTab === 'dreams' && (
        <div className="mind-tab-content scrollable-content">
          {dreams.length === 0 ? (
            <div className="empty-mind-notice">
              <span>🌙</span>
              <div>Gloop hasn't had any sleep dreams yet. Put Gloop to sleep for a while!</div>
            </div>
          ) : (
            <div className="dreams-list">
              {dreams.map((dream) => (
                <div key={dream.id} className="dream-card">
                  <div className="dream-card-header">
                    <span className="dream-card-moon">🌙</span>
                    <span className="dream-card-time">{dream.relativeTime}</span>
                  </div>
                  <div className="dream-card-body">"{dream.text}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Reset / Agency Settings */}
      {activeTab === 'settings' && (
        <div className="mind-tab-content">
          <div className="reset-mind-container">
            <div className="reset-mind-title">Reset Learned Mind</div>
            <div className="reset-mind-description">
              Resets all formed memories, discovered preferences, learned habits, and personality drift
              back to Gloop's default species baseline.
            </div>
            <div className="reset-mind-note">
              Does <strong>NOT</strong> reset Gloop's identity, creation date, current needs, or window settings.
            </div>

            {!confirmingReset ? (
              <button
                className="reset-mind-danger-btn"
                onClick={() => setConfirmingReset(true)}
              >
                Reset Learned Mind...
              </button>
            ) : (
              <div className="reset-confirm-box">
                <div className="reset-confirm-msg">
                  Are you sure? This cannot be undone.
                </div>
                <div className="reset-confirm-actions">
                  <button
                    className="reset-confirm-yes-btn"
                    onClick={() => {
                      setConfirmingReset(false);
                      onResetLearnedMind();
                    }}
                  >
                    Yes, Reset Mind
                  </button>
                  <button
                    className="reset-confirm-cancel-btn"
                    onClick={() => setConfirmingReset(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
