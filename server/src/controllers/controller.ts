import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  async search(ctx) {
    const q = typeof ctx.query.q === 'string' ? ctx.query.q.trim() : '';

    if (!q) {
      ctx.body = { results: [] };
      return;
    }

    const results = await strapi
      .plugin('straplight')
      .service('service')
      .search(q);

    ctx.body = { results };
  },
});

export default controller;
