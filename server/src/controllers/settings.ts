import type { Core } from '@strapi/strapi';
import { PluginSettings, TranslatorUsageStats } from '../services/settings';
import { PLUGIN_ID } from '../../../admin/src/pluginId';

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  /**
   * 获取插件设置（返回时把 usageStats 扩展为包含 limit/available）
   */
  async getSettings(ctx: any) {
    try {
      const settingsService = strapi.plugin(PLUGIN_ID).service('settings');
      const settings: PluginSettings = await settingsService.getSettings();

      const extendedUsageStats = await settingsService.getAllUsageStats();

      const response: Omit<PluginSettings, 'usageStats'> & {
        usageStats: Record<string, TranslatorUsageStats & { limit: number; available: number }>;
      } = {
        ...settings,
        usageStats: extendedUsageStats,
      };

      ctx.send(response);
    } catch (error: any) {
      strapi.log.error('Error getting settings:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * 更新插件设置并返回更新后的设置
   */
  async setSettings(ctx: any) {
    try {
      const settingsService = strapi.plugin(PLUGIN_ID).service('settings');

      const newSettings: PluginSettings = await settingsService.setSettings(ctx.request.body);

      const extendedUsageStats = await settingsService.getAllUsageStats();

      const response: Omit<PluginSettings, 'usageStats'> & {
        usageStats: Record<string, TranslatorUsageStats & { limit: number; available: number }>;
      } = {
        ...newSettings,
        usageStats: extendedUsageStats,
      };

      ctx.send(response);
    } catch (error: any) {
      strapi.log.error('Error setting settings:', error);
      ctx.badRequest(error.message);
    }
  },

  /**
   * 测试翻译器
   */
  async testTranslator(ctx: any) {
    try {
      const { translator, config } = ctx.request.body;

      const result = await strapi
        .plugin(PLUGIN_ID)
        .service('slug')
        .testTranslator(translator, config);

      ctx.body = { data: result };
    } catch (error: any) {
      ctx.badRequest('Failed to test translator', { error: error.message });
    }
  },
});
