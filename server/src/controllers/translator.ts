import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../admin/src/pluginId';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    /**
     * 重置指定翻译器的使用统计
     */
    async resetUsage(ctx: any) {
        try {
            const { translator } = ctx.params;

            if (!translator) {
                return ctx.badRequest('Missing translator name');
            }

            const settingsService = strapi.plugin(PLUGIN_ID).service('settings');
            await settingsService.resetUsageStats(translator);

            ctx.send({
                success: true,
                message: `Usage stats reset for ${translator}`,
            });
        } catch (error: any) {
            strapi.log.error('Error resetting usage:', error);
            ctx.badRequest(error.message);
        }
    },

    /**
     * 获取所有翻译器的使用统计
     */
    async getUsageStats(ctx: any) {
        try {
            const settingsService = strapi.plugin(PLUGIN_ID).service('settings');
            const stats = await settingsService.getAllUsageStats();

            ctx.send(stats);
        } catch (error: any) {
            strapi.log.error('Error getting usage stats:', error);
            ctx.badRequest(error.message);
        }
    },
});
