import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async getSettings(ctx: any) {
    try {
      const settings = await strapi
        .plugin('enhanced-slug')
        .service('settings')
        .getSettings();

      ctx.body = { data: settings };
    } catch (error: any) {
      ctx.badRequest('Failed to get settings', { error: error.message });
    }
  },

  async updateSettings(ctx: any) {
    try {
      const { body } = ctx.request;

      const updatedSettings = await strapi
        .plugin('enhanced-slug')
        .service('settings')
        .updateSettings(body);

      ctx.body = { data: updatedSettings };
    } catch (error: any) {
      ctx.badRequest('Failed to update settings', { error: error.message });
    }
  },

  async testTranslator(ctx: any) {
    try {
      const { translator, config } = ctx.request.body;

      const result = await strapi
        .plugin('enhanced-slug')
        .service('slug')
        .testTranslator(translator, config);

      ctx.body = { data: result };
    } catch (error: any) {
      ctx.badRequest('Failed to test translator', { error: error.message });
    }
  },
});
