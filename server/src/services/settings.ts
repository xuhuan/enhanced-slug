import type { Core } from '@strapi/strapi';

export interface TranslatorCredentials {
    enabled: boolean;
    appId?: string;
    appKey?: string;
    secretId?: string;
    secretKey?: string;
    apiKey?: string;
    region?: string;
    projectId?: string;
}

export interface PluginSettings {
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
    fieldMappings?: Array<{
        contentType: string;
        sourceField: string;
        targetField: string;
    }>;
}

// 默认配置：保证类型完整
const defaultSettings: PluginSettings = {
    mode: 'translation',
    translators: {},
    defaultTargetLanguage: 'en',
    autoSwitchOnFailure: true,
    fieldMappings: [],
};

export default ({ strapi }: { strapi: Core.Strapi }) => ({
    async getSettings(): Promise<PluginSettings> {
        const pluginStore = strapi.store({
            environment: strapi.config.environment,
            type: 'plugin',
            name: 'enhanced-slug',
        });

        const stored = (await pluginStore.get({ key: 'settings' })) as Partial<PluginSettings> | null;

        return {
            ...defaultSettings,
            ...(stored || {}),
            translators: {
                ...defaultSettings.translators,
                ...(stored?.translators || {}),
            },
            fieldMappings: stored?.fieldMappings || [],
        };
    },

    async setSettings(settings: PluginSettings): Promise<PluginSettings> {
        const pluginStore = strapi.store({
            environment: strapi.config.environment,
            type: 'plugin',
            name: 'enhanced-slug',
        });

        await pluginStore.set({
            key: 'settings',
            value: settings,
        });

        return settings;
    },

    async updateSettings(settings: Partial<PluginSettings>): Promise<PluginSettings> {
        const currentSettings = await this.getSettings();
        const updatedSettings: PluginSettings = {
            ...currentSettings,
            ...settings,
            translators: {
                ...currentSettings.translators,
                ...(settings.translators || {}),
            },
        };

        return this.setSettings(updatedSettings);
    },

    validateCredentials(translator: string, credentials: TranslatorCredentials): boolean {
        if (!credentials.enabled) return false;

        switch (translator) {
            case 'baidu':
                return !!(credentials.appId && credentials.appKey);
            case 'tencent':
                return !!(credentials.secretId && credentials.secretKey);
            case 'alibaba':
                return !!(credentials.appId && credentials.appKey);
            case 'deepl':
                return !!credentials.apiKey;
            case 'volcano':
                return !!(credentials.appId && credentials.appKey);
            case 'google':
                return true; // google-translate-api-x 不需要额外凭证
            default:
                return false;
        }
    },
});
