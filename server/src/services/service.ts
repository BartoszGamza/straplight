import type { Core } from '@strapi/strapi';
import { getMainField, getSearchableFields } from '../utils/content-type-helpers';

function getRelationFields(schema: any): string[] {
  const fields: string[] = [];
  for (const [name, attr] of Object.entries(schema.attributes || {})) {
    const a = attr as any;
    if (a.type === 'relation' && a.target?.startsWith('api::')) {
      fields.push(name);
    }
  }
  return fields;
}

function resolveRelationValue(entry: any, fieldName: string, schema: any, strapi: Core.Strapi): string | null {
  const related = entry[fieldName];
  if (!related) return null;

  const item = Array.isArray(related) ? related[0] : related;
  if (!item) return null;

  const attr = (schema as any).attributes?.[fieldName];
  if (!attr?.target) return null;

  const targetSchema = strapi.contentTypes[attr.target as keyof typeof strapi.contentTypes];
  if (!targetSchema) return null;

  const targetMainField = getMainField(targetSchema);
  if (targetMainField && item[targetMainField]) {
    return String(item[targetMainField]);
  }

  return null;
}

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

        // Determine which relation fields need populating
        const displayFields = settings.contentTypes[uid]?.displayFields || [];
        const relationFields = getRelationFields(schema);
        const relationsToPopulate = displayFields.filter((f: string) => relationFields.includes(f));

        const populate: Record<string, any> = {};
        for (const rel of relationsToPopulate) {
          const attr = (schema as any).attributes?.[rel];
          if (!attr?.target) continue;
          const targetSchema = strapi.contentTypes[attr.target as keyof typeof strapi.contentTypes];
          if (!targetSchema) continue;
          const targetMainField = getMainField(targetSchema);
          if (targetMainField) {
            populate[rel] = { fields: [targetMainField] };
          }
        }

        const entries = await strapi.documents(uid as any).findMany({
          filters,
          limit: 5,
          ...(Object.keys(populate).length > 0 ? { populate } : {}),
        });

        const displayName =
          (schema as any).info?.displayName ||
          (schema as any).info?.singularName ||
          uid;

        for (const entry of entries) {
          const fields = displayFields
            .slice(0, 2)
            .filter((f: string) => f !== mainField)
            .map((f: string) => {
              // Check if this is a relation field
              if (relationFields.includes(f)) {
                const value = resolveRelationValue(entry, f, schema, strapi);
                return value ? { name: f, value } : null;
              }
              // Scalar field
              const val = (entry as any)[f];
              return val != null ? { name: f, value: String(val) } : null;
            })
            .filter(Boolean);

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
