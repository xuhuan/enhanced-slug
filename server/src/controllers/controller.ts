import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from "../../../admin/src/pluginId";

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  // --- Settings Controller ---
  async getSettings(ctx) {
    try {
      ctx.body = await strapi
        .plugin(PLUGIN_ID)
        .service('service')
        .getSettings();
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  async updateSettings(ctx) {
    try {
      const newSettings = ctx.request.body;
      ctx.body = await strapi
        .plugin(PLUGIN_ID)
        .service('service')
        .setSettings(newSettings);
    } catch (err) {
      ctx.throw(500, err);
    }
  },

  // --- Slug Generation Controller ---
  async generate(ctx) {
    try {
      const { sourceText } = ctx.request.body as { sourceText: string };
      if (!sourceText) {
        return ctx.badRequest('sourceText is required');
      }
      const slug = await strapi
        .plugin(PLUGIN_ID)
        .service('service')
        .generate(sourceText);
      ctx.body = { slug };
    } catch (err) {
      ctx.throw(500, err);
    }
  },
});

export default controller;
