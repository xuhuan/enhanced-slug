import type { Core } from '@strapi/strapi';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async generate(ctx: any) {
        try {
            const { text, mode, targetLang } = ctx.request.body;

            if (!text) {
                return ctx.badRequest('Text is required');
            }

            const slug = await strapi
                .plugin('enhanced-slug')
                .service('slug')
                .generateSlug(text, { mode, targetLang });

            ctx.body = { data: { slug } };
        } catch (error: any) {
            ctx.badRequest('Failed to generate slug', { error: error.message });
        }
    },
});
