// import type { Core } from '@strapi/strapi';
// import { convertToSlug } from '../utils/slug-converter';
// import { EngineConfig, TranslationEngineType } from 'src/core/translators';

// export interface PluginSettings {
//   mode: 'pinyin' | 'translate';
//   // 引擎的尝试顺序
//   engineOrder: TranslationEngineType[];
//   // 所有引擎的凭据
//   engineConfigs: {
//     [key in TranslationEngineType]?: EngineConfig;
//   };
// }



// const getPluginStore = (strapi: Core.Strapi) => {
//   return strapi.store({
//     environment: strapi.config.environment,
//     type: 'plugin',
//     name: 'enhanced-slug',
//   });
// };


// function isPluginSettings(config: unknown): config is PluginSettings {
//   return (
//     typeof config === 'object' &&
//     config !== null &&
//     'mode' in config &&
//     (config.mode === 'pinyin' || config.mode === 'google-translate')
//   );
// }

// const service = ({ strapi }: { strapi: Core.Strapi }) => ({
//   async getSettings(): Promise<PluginSettings> { // 3. 明确函数的返回类型
//     const store = getPluginStore(strapi);
//     const config = await store.get({ key: 'settings' });

//     // 4. 使用类型守卫进行检查
//     if (isPluginSettings(config)) {
//       return config;
//     }

//     // 如果检查不通过或 config 为空，返回默认值
//     return { mode: 'pinyin' };
//   },

//   async setSettings(settings: PluginSettings): Promise<PluginSettings> {
//     const store = getPluginStore(strapi);
//     await store.set({ key: 'settings', value: settings });
//     return this.getSettings();
//   },

//   // --- Slug Generation Service ---
//   async generate(sourceText: string) {
//     // 现在 settings 的类型是确定的 PluginSettings
//     const settings = await this.getSettings();
//     return convertToSlug(sourceText, settings.mode);
//   },
// });

// export default service;
