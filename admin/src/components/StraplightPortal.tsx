import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Tiny component injected into content-manager zones.
 * Its only job: capture `navigate` and store it globally
 * so the standalone overlay can do SPA navigation.
 */
export function NavigateCapture() {
  const navigate = useNavigate();

  useEffect(() => {
    (window as any).__straplight = (window as any).__straplight || {};
    (window as any).__straplight.navigate = navigate;
  }, [navigate]);

  return null;
}
