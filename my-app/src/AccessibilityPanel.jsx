import React, { useState, useEffect } from 'react';
import './AccessibilityPanel.css';

function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [contrastMode, setContrastMode] = useState('normal');
  const [magnification, setMagnification] = useState(100);

  // Load preferences from localStorage on mount
  useEffect(() => {
    const savedContrast = localStorage.getItem('a11y-contrast');
    const savedMagnification = localStorage.getItem('a11y-magnification');
    
    if (savedContrast) {
      setContrastMode(savedContrast);
      applyContrastMode(savedContrast);
    }
    if (savedMagnification) {
      const mag = parseInt(savedMagnification);
      setMagnification(mag);
      applyMagnification(mag);
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

  const applyMagnification = (level) => {
    // Use body zoom to avoid reparenting React-managed nodes
    document.body.style.zoom = `${level}%`;

    localStorage.setItem('a11y-magnification', level.toString());
  };

  const handleContrastToggle = () => {
    const newMode = contrastMode === 'normal' ? 'high' : 'normal';
    setContrastMode(newMode);
    applyContrastMode(newMode);
  };

  const handleMagnificationChange = (e) => {
    const newLevel = parseInt(e.target.value);
    setMagnification(newLevel);
    applyMagnification(newLevel);
  };

  const increaseMagnification = () => {
    const newLevel = Math.min(magnification + 10, 200);
    setMagnification(newLevel);
    applyMagnification(newLevel);
  };

  const decreaseMagnification = () => {
    const newLevel = Math.max(magnification - 10, 100);
    setMagnification(newLevel);
    applyMagnification(newLevel);
  };

  const resetAll = () => {
    setContrastMode('normal');
    setMagnification(100);
    applyContrastMode('normal');
    applyMagnification(100);
    document.body.style.zoom = '100%';
    localStorage.removeItem('a11y-contrast');
    localStorage.removeItem('a11y-magnification');
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

          {/* Screen Magnifier */}
          <div className="accessibility-option">
            <div className="magnification-controls">
              <label htmlFor="magnification-slider" className="magnification-label">
                <span className="magnification-icon"></span>
                Screen Magnifier: {magnification}%
              </label>
              <div className="magnification-buttons">
                <button
                  className="magnification-btn"
                  onClick={decreaseMagnification}
                  aria-label="Decrease magnification"
                  disabled={magnification <= 100}
                  title="Decrease zoom level"
                >
                  −
                </button>
                <input
                  id="magnification-slider"
                  type="range"
                  min="100"
                  max="200"
                  step="10"
                  value={magnification}
                  onChange={handleMagnificationChange}
                  aria-label="Magnification level slider"
                  title={`Current magnification: ${magnification}%`}
                  className="magnification-slider"
                />
                <button
                  className="magnification-btn"
                  onClick={increaseMagnification}
                  aria-label="Increase magnification"
                  disabled={magnification >= 200}
                  title="Increase zoom level"
                >
                  +
                </button>
              </div>
            </div>
            <p className="option-description">Magnify the entire page (100% - 200%)</p>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default AccessibilityPanel;
