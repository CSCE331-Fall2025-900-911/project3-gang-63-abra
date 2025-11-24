import React, { useState, useEffect } from 'react';
import './AccessibilityPanel.css';

function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [contrastMode, setContrastMode] = useState('normal');

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedContrast = localStorage.getItem('a11y-contrast');
    
    if (savedContrast) {
      setContrastMode(savedContrast);
      applyContrastMode(savedContrast);
    }
  }, []);

  const applyContrastMode = (mode) => {
    const root = document.documentElement;
    
    if (mode === 'high') {
      root.setAttribute('data-contrast', 'high');
      document.body.classList.add('high-contrast-mode');
    } else {
      root.removeAttribute('data-contrast');
      document.body.classList.remove('high-contrast-mode');
    }
    
    localStorage.setItem('a11y-contrast', mode);
  };

  const handleContrastToggle = () => {
    const newMode = contrastMode === 'normal' ? 'high' : 'normal';
    setContrastMode(newMode);
    applyContrastMode(newMode);
  };

  const resetAll = () => {
    setContrastMode('normal');
    applyContrastMode('normal');
    localStorage.removeItem('a11y-contrast');
  };

  return (
    <div className="accessibility-panel">
      {/* Toggle Button */}
      <button
        className="accessibility-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle accessibility options"
        aria-expanded={isOpen}
        aria-controls="accessibility-menu"
        title="Accessibility Options"
      >
        <span aria-hidden="true">♿</span>
        <span className="sr-only">Accessibility Menu</span>
      </button>

      {/* Accessibility Menu */}
      {isOpen && (
        <div
          id="accessibility-menu"
          className="accessibility-menu"
          role="region"
          aria-label="Accessibility options"
        >
          <h2 className="accessibility-menu-title">Accessibility Options</h2>
          
          {/* Contrast Toggle */}
          <div className="accessibility-option">
            <button
              className={`toggle-button ${contrastMode === 'high' ? 'active' : ''}`}
              onClick={handleContrastToggle}
              aria-pressed={contrastMode === 'high'}
              title={`Current contrast: ${contrastMode}`}
            >
              <span className="toggle-icon"></span>
              {contrastMode === 'high' ? 'High Contrast: ON' : 'High Contrast: OFF'}
            </button>
            <p className="option-description">Increase contrast for easier reading</p>
          </div>

          {/* Reset Button */}
          <button
            className="reset-button"
            onClick={resetAll}
            aria-label="Reset all accessibility settings to default"
            title="Reset to default settings"
          >
            Reset All Settings
          </button>

          {/* Accessibility Info */}
          <div className="accessibility-info">
            <p className="info-text">
              This website is designed to be accessible to all users. These tools help optimize your experience.
            </p>
            <p className="wcag-note">
              WCAG 2.1 Level AA Compliant
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessibilityPanel;
