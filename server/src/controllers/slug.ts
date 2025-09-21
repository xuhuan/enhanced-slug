import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../admin/src/pluginId';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async generate(ctx: any) {
    try {
      const { text, mode, targetLang } = ctx.request.body;

      if (!text) {
        return ctx.badRequest('Text is required');
      }

      const slug = await strapi
        .plugin(PLUGIN_ID)
        .service('slug')
        .generateSlug(text, { mode, targetLang });

      ctx.body = { data: { slug } };
    } catch (error: any) {
      ctx.badRequest('Failed to generate slug', { error: error.message });
    }
  },

  async check(ctx: any) {
    try {
      const { id, slug, key, uid, currentLocale, locale } = ctx.request.body;

      if (!slug || !key || !uid) {
        return ctx.badRequest('Missing required parameters: slug, key, uid');
      }

      const checkParams = {
        id,
        slug,
        key,
        uid,
        locale: locale || currentLocale,
      };

      strapi.log.info('Check slug params:', checkParams);

      const result = await strapi
        .plugin(PLUGIN_ID)
        .service('slug')
        .check(checkParams);

      ctx.body = { data: { result } };
    } catch (error: any) {
      strapi.log.error('Check slug error:', error);
      ctx.badRequest('Failed to check slug', {
        error: error.message,
        details: error.stack,
      });
    }
  },
});
