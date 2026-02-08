import { useState, useEffect } from 'react';
import { getFetchClient } from '@strapi/strapi/admin';
import { PLUGIN_ID } from '../pluginId';

interface StraplightSettings {
  debounceMs: number;
  minQueryLength: number;
}

const DEFAULTS: StraplightSettings = {
  debounceMs: 200,
  minQueryLength: 1,
};

export function useStraplightSettings() {
  const [settings, setSettings] = useState<StraplightSettings>(DEFAULTS);

  useEffect(() => {
    const { get } = getFetchClient();
    get(`/${PLUGIN_ID}/settings`)
      .then(({ data }: any) => {
        setSettings({
          debounceMs: data.settings?.debounceMs ?? DEFAULTS.debounceMs,
          minQueryLength: data.settings?.minQueryLength ?? DEFAULTS.minQueryLength,
        });
      })
      .catch(() => {
        // Fall back to defaults silently
      });
  }, []);

  return settings;
}
