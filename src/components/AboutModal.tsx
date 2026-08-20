import React, { useEffect, useRef } from 'react';
import { PetProfile, SpeciesIdentity } from '../types/pet';

interface AboutModalProps {
  species: SpeciesIdentity;
  petProfile: PetProfile | null;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ species, petProfile, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const createdDate = petProfile?.createdAt
    ? new Date(petProfile.createdAt).toLocaleDateString()
    : 'Unknown';

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div className="about-modal-card" onClick={(e) => e.stopPropagation()}>
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
            <div className="about-value">{species.speciesId} (schema {species.schemaVersion})</div>
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

        <button
          ref={closeButtonRef}
          className="about-close-btn"
          onClick={onClose}
          aria-label="Close about dialog"
        >
          Close
        </button>
      </div>
    </div>
  );
};
