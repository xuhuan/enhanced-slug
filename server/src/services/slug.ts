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
    const settingsService = strapi.plugin('enhanced-slug').service('settings');
    const settings: PluginSettings = await settingsService.getSettings();

    const mode = options?.mode || settings.mode;
    const targetLang = options?.targetLang || settings.defaultTargetLanguage;

    if (mode === 'pinyin') {
      return this.generatePinyinSlug(text);
    }

    // Try translation mode
    const slug = await this.generateTranslationSlug(text, targetLang, settings);

    // If translation fails and autoSwitchOnFailure is enabled, fallback to pinyin
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
    const enabledTranslators = this.getEnabledTranslators(settings);

    for (const translator of enabledTranslators) {
      try {
        const result = await translator.translate(text, 'auto', targetLang);
        if (result.success && result.text) {
          return slugify(result.text);
        }
        strapi.log.warn(`Translator ${translator.getName()} failed: ${result.error}`);
      } catch (error: any) {
        strapi.log.error(`Error with translator ${translator.getName()}: ${error.message}`);
      }
    }

    return '';
  },

  async generatePinyinSlug(text: string): Promise<string> {
    const pinyinTranslator = new PinyinTranslator({});
    const result = await pinyinTranslator.translate(text);
    return result.success ? result.text : '';
  },

  getEnabledTranslators(settings: PluginSettings): BaseTranslator[] {
    const translators: BaseTranslator[] = [];
    const settingsService = strapi.plugin('enhanced-slug').service('settings');

    if (
      settings.translators.baidu?.enabled &&
      settingsService.validateCredentials('baidu', settings.translators.baidu)
    ) {
      translators.push(new BaiduTranslator(settings.translators.baidu));
    }

    if (
      settings.translators.tencent?.enabled &&
      settingsService.validateCredentials('tencent', settings.translators.tencent)
    ) {
      translators.push(new TencentTranslator(settings.translators.tencent));
    }

    if (
      settings.translators.alibaba?.enabled &&
      settingsService.validateCredentials('alibaba', settings.translators.alibaba)
    ) {
      translators.push(new AlibabaTranslator(settings.translators.alibaba));
    }

    if (
      settings.translators.deepl?.enabled &&
      settingsService.validateCredentials('deepl', settings.translators.deepl)
    ) {
      translators.push(new DeepLTranslator(settings.translators.deepl));
    }

    if (
      settings.translators.volcano?.enabled &&
      settingsService.validateCredentials('volcano', settings.translators.volcano)
    ) {
      translators.push(new VolcanoTranslator(settings.translators.volcano));
    }

    if (settings.translators.google?.enabled) {
      translators.push(new GoogleTranslator(settings.translators.google || {}));
    }

    return translators;
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

  /**
   * 检查 slug 唯一性
   * @param {object} params - 检查参数
   * @returns {Promise<{isValid: boolean, message?: string}>}
   */
  async check(params: CheckSlugParams): Promise<{ isValid: boolean; message?: string }> {
    const { id, slug, key, uid, locale } = params;

    try {
      if (!slug || !slug.trim()) {
        return {
          isValid: false,
          message: 'Slug cannot be empty',
        };
      }

      // 构建查询条件 - 修复类型错误
      const where: Record<string, any> = {
        [key]: slug,
      };

      // 如果是更新操作，排除当前记录
      if (id) {
        where.id = { $ne: id };
      }

      // 如果启用了国际化，添加 locale 条件
      if (locale) {
        where.locale = locale;
      }

      console.log('Checking slug with filters:', where, 'for uid:', uid);

      // 查询是否存在重复的 slug
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
