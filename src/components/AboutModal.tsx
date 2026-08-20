import React, { useEffect, useRef } from 'react';
import { PetProfile, SpeciesIdentity } from '../types/pet';

export interface AboutCardProps {
  species: SpeciesIdentity;
  petProfile: PetProfile | null;
  onBack?: () => void;
  onClose: () => void;
}

export const AboutCard: React.FC<AboutCardProps> = ({
  species,
  petProfile,
  onBack,
  onClose,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const createdDate = petProfile?.createdAt
    ? new Date(petProfile.createdAt).toLocaleDateString()
    : 'Unknown';

  return (
    <div className="about-card" role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
      <div className="about-modal-header">
        <h2 id="about-modal-title" className="about-title">
          AI-Tamagotchi
        </h2>
        <span className="about-version">v0.1.0 (M001)</span>
      </div>

      <div className="about-content">
        <div className="about-section">
          <div className="about-label">Companion</div>
          <div className="about-value">{petProfile?.name || species.canonicalName}</div>
        </div>

        <div className="about-section">
          <div className="about-label">Species DNA</div>
          <div className="about-value">{species.speciesId} (v{species.schemaVersion})</div>
        </div>

        <div className="about-section">
          <div className="about-label">Temperament</div>
          <div className="about-tags">
            {species.temperamentTags.map((tag) => (
              <span key={tag} className="about-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="about-section">
          <div className="about-label">Hatched Date</div>
          <div className="about-value">{createdDate}</div>
        </div>
      </div>

      <div className="about-button-row">
        {onBack && (
          <button className="about-btn" onClick={onBack} aria-label="Back to companion menu">
            Back
          </button>
        )}
        <button
          ref={closeButtonRef}
          className="about-btn primary"
          onClick={onClose}
          aria-label="Close about dialog"
        >
          Close
        </button>
      </div>
    </div>
  );
};
