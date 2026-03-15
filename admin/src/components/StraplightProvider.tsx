import { useEffect, useState } from 'react';
import { DesignSystemProvider, lightTheme, darkTheme } from '@strapi/design-system';
import { StraplightOverlay } from './StraplightOverlay';

function resolveIsDark() {
  const stored = localStorage.getItem('STRAPI_THEME') || 'system';
  if (stored === 'dark') return true;
  if (stored === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function StraplightProvider() {
  const [isDark, setIsDark] = useState(resolveIsDark);

  useEffect(() => {
    function update() { setIsDark(resolveIsDark()); }
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    window.addEventListener('storage', update);
    // 'storage' only fires in other tabs; patch setItem to catch same-tab changes
    const originalSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key: string, value: string) {
      originalSetItem(key, value);
      if (key === 'STRAPI_THEME') update();
    };
    return () => {
      mq.removeEventListener('change', update);
      window.removeEventListener('storage', update);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  return (
    <DesignSystemProvider theme={isDark ? darkTheme : lightTheme}>
      <StraplightOverlay />
    </DesignSystemProvider>
  );
}
