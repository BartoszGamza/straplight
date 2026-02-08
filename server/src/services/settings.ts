import type { Core } from '@strapi/strapi';
import { STRING_FIELD_TYPES, getMainField } from '../utils/content-type-helpers';

interface ContentTypeSettings {
  enabled: boolean;
  displayFields: string[];
}

export interface StraplightSettings {
  debounceMs: number;
  minQueryLength: number;
  contentTypes: Record<string, ContentTypeSettings>;
}

export interface ContentTypeInfo {
  uid: string;
  displayName: string;
  fields: { name: string; type: string }[];
  mainField: string;
}

const DEFAULTS: StraplightSettings = {
  debounceMs: 200,
  minQueryLength: 1,
  contentTypes: {},
};

const settings = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getSettings(): Promise<StraplightSettings> {
    const store = strapi.store({ type: 'plugin', name: 'straplight' });
    const data = await store.get({ key: 'settings' }) as Partial<StraplightSettings> | null;
    return {
      ...DEFAULTS,
      ...(data || {}),
    };
  },

  async setSettings(newSettings: StraplightSettings): Promise<StraplightSettings> {
    // Validate
    const validated: StraplightSettings = {
      debounceMs: Math.max(0, Math.round(Number(newSettings.debounceMs) || DEFAULTS.debounceMs)),
      minQueryLength: Math.max(1, Math.round(Number(newSettings.minQueryLength) || DEFAULTS.minQueryLength)),
      contentTypes: {},
    };

    // Validate content type entries
    if (newSettings.contentTypes && typeof newSettings.contentTypes === 'object') {
      for (const [uid, ct] of Object.entries(newSettings.contentTypes)) {
        if (!uid.startsWith('api::')) continue;
        validated.contentTypes[uid] = {
          enabled: ct.enabled !== false,
          displayFields: Array.isArray(ct.displayFields) ? ct.displayFields.slice(0, 2) : [],
        };
      }
    }

    const store = strapi.store({ type: 'plugin', name: 'straplight' });
    await store.set({ key: 'settings', value: validated });
    return validated;
  },

  getContentTypes(): ContentTypeInfo[] {
    return Object.entries(strapi.contentTypes)
      .filter(([uid]) => uid.startsWith('api::'))
      .map(([uid, schema]) => ({
        uid,
        displayName:
          (schema as any).info?.displayName ||
          (schema as any).info?.singularName ||
          uid,
        fields: Object.entries((schema as any).attributes || {})
          .filter(([, attr]) => STRING_FIELD_TYPES.has((attr as any).type))
          .map(([name, attr]) => ({ name, type: (attr as any).type })),
        mainField: getMainField(schema) || '',
      }));
  },
});

export default settings;
