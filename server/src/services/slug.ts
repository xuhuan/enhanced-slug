import type { Core } from '@strapi/strapi';
import {
  BaseTranslator,
  BaiduTranslator,
  TencentTranslator,
  AlibabaTranslator,
  DeepLTranslator,
  VolcanoTranslator,
  GoogleTranslator,
  PinyinTranslator,
} from './translators';
import type { PluginSettings, TranslatorCredentials } from './settings';
import { PLUGIN_ID } from '../../../admin/src/pluginId';
import { slugify } from '../utils/slug';

export interface CheckSlugParams {
  id?: string | number;
  slug: string;
  key: string;
  uid: any;
  locale?: string;
}

export default ({ strapi }: { strapi: Core.Strapi }) => ({
  async generateSlug(
    text: string,
    options?: { mode?: 'translation' | 'pinyin'; targetLang?: string }
  ): Promise<string> {
    const settingsService = strapi.plugin(PLUGIN_ID).service('settings');
    const settings: PluginSettings = await settingsService.getSettings();

    const mode = options?.mode || settings.mode;
    const targetLang = options?.targetLang || settings.defaultTargetLanguage;

    if (mode === 'pinyin') {
      return this.generatePinyinSlug(text);
    }

    // 翻译模式
    const slug = await this.generateTranslationSlug(text, targetLang, settings);

    // 如果翻译失败且启用自动切换,回退到拼音
    if (!slug && settings.autoSwitchOnFailure) {
      strapi.log.info('All translators failed, falling back to pinyin');
      return this.generatePinyinSlug(text);
    }

    return slug || '';
  },

  async generateTranslationSlug(
    text: string,
    targetLang: string,
    settings: PluginSettings
  ): Promise<string> {
    const settingsService = strapi.plugin(PLUGIN_ID).service('settings');
    const translators = await this.getAvailableTranslators(settings);

    if (translators.length === 0) {
      strapi.log.warn('No available translators');
      return '';
    }

    // 按使用模式选择翻译器
    const sortedTranslators = settings.usageMode === 'balanced'
      ? this.shuffleTranslators(translators)
      : translators; // priority模式已经排序

    for (const { translator, name } of sortedTranslators) {
      try {
        const charCount = text.length;

        // 翻译前再次检查可用性
        const isAvailable = await settingsService.isTranslatorAvailable(name);
        if (!isAvailable) {
          strapi.log.info(`Translator ${name} reached monthly limit, skipping`);
          continue;
        }

        const result = await translator.translate(text, 'auto', targetLang);

        if (result.success && result.text) {
          // 记录使用量
          await settingsService.recordUsage(name, charCount);
          strapi.log.info(`Translation successful with ${name}, used ${charCount} chars`);
          return slugify(result.text);
        }

        strapi.log.warn(`Translator ${name} failed: ${result.error}`);
      } catch (error: any) {
        strapi.log.error(`Error with translator ${name}: ${error.message}`);
      }
    }

    return '';
  },

  async generatePinyinSlug(text: string): Promise<string> {
    const pinyinTranslator = new PinyinTranslator({});
    const result = await pinyinTranslator.translate(text);
    return result.success ? result.text : '';
  },

  /**
   * 获取可用的翻译器(已排序并过滤)
   */
  async getAvailableTranslators(settings: PluginSettings): Promise<Array<{ translator: BaseTranslator; name: string; priority: number }>> {
    const settingsService = strapi.plugin(PLUGIN_ID).service('settings');
    const translators: Array<{ translator: BaseTranslator; name: string; priority: number }> = [];

    const translatorConfigs = [
      { name: 'baidu', Class: BaiduTranslator, config: settings.translators.baidu },
      { name: 'tencent', Class: TencentTranslator, config: settings.translators.tencent },
      { name: 'alibaba', Class: AlibabaTranslator, config: settings.translators.alibaba },
      { name: 'deepl', Class: DeepLTranslator, config: settings.translators.deepl },
      { name: 'volcano', Class: VolcanoTranslator, config: settings.translators.volcano },
      { name: 'google', Class: GoogleTranslator, config: settings.translators.google },
    ];

    for (const { name, Class, config } of translatorConfigs) {
      if (!config?.enabled) continue;

      // 验证凭证
      if (!settingsService.validateCredentials(name, config)) {
        continue;
      }

      // 检查是否达到月度限额
      const isAvailable = await settingsService.isTranslatorAvailable(name);
      if (!isAvailable) {
        strapi.log.info(`Translator ${name} reached monthly limit`);
        continue;
      }

      translators.push({
        translator: new Class(config),
        name,
        priority: config.priority ?? 999, // 默认优先级999
      });
    }

    // 按优先级排序(数字越小优先级越高)
    return translators.sort((a, b) => a.priority - b.priority);
  },

  /**
   * 负载均衡模式:随机打乱翻译器顺序
   */
  shuffleTranslators<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  async testTranslator(
    translatorName: string,
    config: TranslatorCredentials
  ): Promise<{ success: boolean; message: string }> {
    try {
      let translator: BaseTranslator;

      switch (translatorName) {
        case 'baidu':
          translator = new BaiduTranslator(config);
          break;
        case 'tencent':
          translator = new TencentTranslator(config);
          break;
        case 'alibaba':
          translator = new AlibabaTranslator(config);
          break;
        case 'deepl':
          translator = new DeepLTranslator(config);
          break;
        case 'volcano':
          translator = new VolcanoTranslator(config);
          break;
        case 'google':
          translator = new GoogleTranslator(config);
          break;
        default:
          return { success: false, message: 'Unknown translator' };
      }

      if (!translator.validateConfig()) {
        return { success: false, message: 'Invalid configuration' };
      }

      const result = await translator.translate('Hello', 'en', 'en');

      if (result.success) {
        return { success: true, message: 'Test successful' };
      } else {
        return { success: false, message: result.error || 'Translation failed' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Test failed' };
    }
  },

  async check(params: CheckSlugParams): Promise<{ isValid: boolean; message?: string }> {
    const { id, slug, key, uid, locale } = params;

    try {
      if (!slug || !slug.trim()) {
        return {
          isValid: false,
          message: 'Slug cannot be empty',
        };
      }

      const where: Record<string, any> = {
        [key]: slug,
      };

      if (id) {
        where.id = { $ne: id };
      }

      if (locale) {
        where.locale = locale;
      }

      const existingEntry = await strapi.entityService.findMany(uid, {
        filters: where,
        limit: 1,
      });

      if (existingEntry && existingEntry.length > 0) {
        return {
          isValid: false,
          message: `Slug "${slug}" already exists${locale ? ` for locale ${locale}` : ''}`,
        };
      }

      return {
        isValid: true,
        message: 'Slug is available',
      };
    } catch (error: any) {
      strapi.log.error('Error checking slug:', error);
      return {
        isValid: false,
        message: 'Error validating slug',
      };
    }
  },
});
