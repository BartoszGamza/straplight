import type { Core } from '@strapi/strapi';

const settings = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getSettings(ctx: any) {
    const settingsService = strapi.plugin('straplight').service('settings');
    const currentSettings = await settingsService.getSettings();
    const contentTypes = settingsService.getContentTypes();
    ctx.body = { settings: currentSettings, contentTypes };
  },

  async updateSettings(ctx: any) {
    const settingsService = strapi.plugin('straplight').service('settings');
    const saved = await settingsService.setSettings(ctx.request.body);
    ctx.body = { settings: saved };
  },
});

export default settings;
