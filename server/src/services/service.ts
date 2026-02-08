import type { Core } from '@strapi/strapi';
import { getMainField, getSearchableFields } from '../utils/content-type-helpers';

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async search(query: string) {
    const settings = await strapi.plugin('straplight').service('settings').getSettings();
    const allResults: any[] = [];

    const contentTypes = Object.entries(strapi.contentTypes)
      .filter(([uid]) => uid.startsWith('api::'))
      .filter(([uid]) => settings.contentTypes[uid]?.enabled !== false);

    const promises = contentTypes.map(async ([uid, schema]) => {
      try {
        const searchableFields = getSearchableFields(schema);
        if (searchableFields.length === 0) return;

        const mainField = getMainField(schema) || searchableFields[0];

        const filters = {
          $or: searchableFields.map((field) => ({
            [field]: { $containsi: query },
          })),
        };

        const entries = await strapi.documents(uid as any).findMany({
          filters,
          limit: 5,
        });

        const displayName =
          (schema as any).info?.displayName ||
          (schema as any).info?.singularName ||
          uid;

        const displayFields = settings.contentTypes[uid]?.displayFields || [];

        for (const entry of entries) {
          const fields = displayFields
            .slice(0, 2)
            .filter((f: string) => f !== mainField && (entry as any)[f] != null)
            .map((f: string) => ({ name: f, value: String((entry as any)[f]) }));

          allResults.push({
            id: entry.id,
            documentId: entry.documentId,
            label: (entry as any)[mainField] || `#${entry.documentId}`,
            contentType: displayName,
            uid,
            fields,
          });
        }
      } catch {
        // Skip content types that fail to query
      }
    });

    await Promise.all(promises);
    return allResults;
  },
});

export default service;
