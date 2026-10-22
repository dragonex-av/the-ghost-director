/**
 * ============================================================================
 * THE GHOST-DIRECTOR: FIRE OS & VEGA OS 10-FOOT D-PAD NAVIGATION HOOK
 * ============================================================================
 * Simulates the Alexa Voice Remote directional pad, Select, Back, Play/Pause,
 * and Mic buttons for true living room television ergonomics.
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';

export function useTvDpadNavigation({ onSelect, onBack, onPlayPause, onMic }) {
  const [activeFocusId, setActiveFocusId] = useState('pip-primary-action');
  const [lastDpadDirection, setLastDpadDirection] = useState(null);

  const handleKeyDown = useCallback(
    (e) => {
      // Don't intercept when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setLastDpadDirection('UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setLastDpadDirection('DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setLastDpadDirection('LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          setLastDpadDirection('RIGHT');
          break;
        case 'Enter':
          e.preventDefault();
          if (onSelect) onSelect(activeFocusId);
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          if (onBack) onBack();
          break;
        case 'p':
        case 'P':
        case 'MediaPlayPause':
          e.preventDefault();
          if (onPlayPause) onPlayPause();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          if (onMic) onMic();
          break;
        default:
          break;
      }
    },
    [activeFocusId, onSelect, onBack, onPlayPause, onMic]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    activeFocusId,
    setActiveFocusId,
    lastDpadDirection,
  };
}
