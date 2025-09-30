import type { Core } from '@strapi/strapi';
import { PLUGIN_ID } from '../../../admin/src/pluginId';

export type TranslatorCredentials = {
    enabled: boolean;
    appId?: string;
    appKey?: string;
    secretId?: string;
    secretKey?: string;
    apiKey?: string;
    region?: string;
    projectId?: string;
    // 新增字段
    priority?: number; // 优先级,数字越小优先级越高
    monthlyCharLimit?: number; // 每月字符使用限额,0表示无限制
};

export type TranslatorUsageStats = {
    currentMonth: string; // YYYY-MM格式
    charsUsed: number; // 本月已使用字符数
    lastResetDate: string; // 上次重置日期
};

export type UsageMode = 'priority' | 'balanced'; // priority: 按优先级, balanced: 负载均衡

export type PluginSettings = {
    mode: 'translation' | 'pinyin';
    translators: {
        baidu?: TranslatorCredentials;
        tencent?: TranslatorCredentials;
        alibaba?: TranslatorCredentials;
        deepl?: TranslatorCredentials;
        volcano?: TranslatorCredentials;
        google?: TranslatorCredentials;
    };
    defaultTargetLanguage: string;
    autoSwitchOnFailure: boolean;
    // 新增字段
    usageMode: UsageMode; // 使用模式
    usageStats: {
        baidu?: TranslatorUsageStats;
        tencent?: TranslatorUsageStats;
        alibaba?: TranslatorUsageStats;
        deepl?: TranslatorUsageStats;
        volcano?: TranslatorUsageStats;
        google?: TranslatorUsageStats;
    };
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    /**
    * 获取一个 Strapi store 实例
    * @returns {any}
    */
    getStore() {
        return strapi.store({
            environment: strapi.config.environment,
            type: 'plugin',
            name: PLUGIN_ID,
        });
    },

    /**
     * 获取设置，并与默认值合并，确保返回完整的配置对象
     */
    async getSettings(): Promise<PluginSettings> {
        // 步骤 1: 使用稳定可靠的 strapi.store()
        const storedSettings = await this.getStore().get({ key: 'settings' });
        return this.withDefaults(storedSettings || {});
    },

    /**
     * 保存完整的设置对象
     * @param {PluginSettings} settings - 完整的设置对象
     * @returns {Promise<PluginSettings>}
     */
    async saveSettings(settings: PluginSettings): Promise<PluginSettings> {
        await this.getStore().set({ key: 'settings', value: settings });
        return settings;
    },

    /**
     * 更新并保存部分设置 (旧称 setSettings)
     * @param {Partial<PluginSettings>} settings - 需要更新的部分设置
     * @returns {Promise<PluginSettings>}
     */
    async setSettings(settings: Partial<PluginSettings>): Promise<PluginSettings> {
        const currentSettings = await this.getSettings();

        // 步骤 3: 执行深度合并，防止内嵌对象被整个覆盖
        const newSettings: PluginSettings = {
            ...currentSettings,
            ...settings, // 应用顶层更新
            translators: { // 特别处理 translators 对象的合并
                ...currentSettings.translators,
                ...(settings.translators || {}),
            },
            usageStats: { // 特别处理 usageStats 对象的合并
                ...currentSettings.usageStats,
                ...(settings.usageStats || {}),
            },
        };

        return this.saveSettings(newSettings);
    },


    withDefaults(settings: Partial<PluginSettings>): PluginSettings {
        const currentMonth = this.getCurrentMonth();

        // Ensure usageStats exists with proper structure
        const usageStats = settings.usageStats || {};

        return {
            mode: settings.mode || 'translation',
            translators: settings.translators || {},
            defaultTargetLanguage: settings.defaultTargetLanguage || 'en',
            autoSwitchOnFailure: settings.autoSwitchOnFailure ?? true,
            usageMode: settings.usageMode || 'priority',
            usageStats: usageStats,
        };
    },

    validateCredentials(translator: string, config: TranslatorCredentials): boolean {
        if (!config || !config.enabled) {
            return false;
        }

        switch (translator) {
            case 'baidu':
                return !!(config.appId && config.appKey);
            case 'tencent':
                return !!(config.secretId && config.secretKey);
            case 'alibaba':
                return !!(config.appId && config.appKey);
            case 'deepl':
                return !!config.apiKey;
            case 'volcano':
                return !!(config.appId && config.appKey);
            case 'google':
                return true;
            default:
                return false;
        }
    },

    getCurrentMonth(): string {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    },

    /**
     * 检查翻译器是否达到月度限额
     */
    async isTranslatorAvailable(translatorName: string): Promise<boolean> {
        const settings = await this.getSettings();
        const config = settings.translators[translatorName as keyof typeof settings.translators];

        if (!config || !config.enabled) {
            return false;
        }

        // 无限额限制
        if (!config.monthlyCharLimit || config.monthlyCharLimit === 0) {
            return true;
        }

        const currentMonth = this.getCurrentMonth();
        const stats = settings.usageStats[translatorName as keyof typeof settings.usageStats];

        // 首次使用或跨月,自动重置
        if (!stats || stats.currentMonth !== currentMonth) {
            await this.resetUsageStats(translatorName);
            return true;
        }

        // 检查是否超限
        return stats.charsUsed < config.monthlyCharLimit;
    },

    /**
     * 记录字符使用量
     */
    async recordUsage(translatorName: string, charCount: number): Promise<void> {
        const settings = await this.getSettings();
        const currentMonth = this.getCurrentMonth();

        let stats = settings.usageStats[translatorName as keyof typeof settings.usageStats];

        // 跨月自动重置
        if (!stats || stats.currentMonth !== currentMonth) {
            stats = {
                currentMonth,
                charsUsed: 0,
                lastResetDate: new Date().toISOString(),
            };
        }

        stats.charsUsed += charCount;

        const newSettings = {
            ...settings,
            usageStats: {
                ...settings.usageStats,
                [translatorName]: stats,
            },
        };

        await this.setSettings(newSettings);
    },

    /**
     * 重置使用统计
     */
    async resetUsageStats(translatorName: string): Promise<void> {
        const settings = await this.getSettings();
        const currentMonth = this.getCurrentMonth();

        const newSettings = {
            ...settings,
            usageStats: {
                ...settings.usageStats,
                [translatorName]: {
                    currentMonth,
                    charsUsed: 0,
                    lastResetDate: new Date().toISOString(),
                },
            },
        };

        await this.setSettings(newSettings);
    },

    /**
     * 获取所有使用统计
     */
    async getAllUsageStats(): Promise<Record<string, TranslatorUsageStats & { limit: number; available: number }>> {
        const settings = await this.getSettings();
        const result: Record<string, any> = {};

        for (const [name, config] of Object.entries(settings.translators)) {
            if (!config) continue;

            const stats = settings.usageStats[name as keyof typeof settings.usageStats];
            const limit = config.monthlyCharLimit || 0;
            const used = stats?.charsUsed || 0;

            result[name] = {
                currentMonth: stats?.currentMonth || this.getCurrentMonth(),
                charsUsed: used,
                lastResetDate: stats?.lastResetDate || new Date().toISOString(),
                limit,
                available: limit > 0 ? Math.max(0, limit - used) : Infinity,
            };
        }

        return result;
    },
});
