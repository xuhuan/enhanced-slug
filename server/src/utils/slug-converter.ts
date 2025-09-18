
// import translate from 'google-translate-api-x';
// import { pinyin } from 'pinyin-pro';

// /**
//  * 将字符串转换为 URL 友好的 slug 格式
//  * @param text - 输入字符串
//  * @returns slug 格式的字符串
//  */
// function slugify(text: string): string {
//     return text
//         .toString()
//         .toLowerCase()
//         .trim()
//         .replace(/\s+/g, '-')     // 将空格替换为 -
//         .replace(/[^\w-]+/g, '')  // 移除所有非单词字符
//         .replace(/--+/g, '-');    // 将多个 - 替换为单个 -
// }

// /**
//  * 使用谷歌翻译将文本转换为英文 slug
//  * @param text - 中文文本
//  * @returns 翻译后的英文 slug
//  */
// async function getGoogleTranslatedSlug(text: string): Promise<string> {
//     try {
//         const { text: translatedText } = await translate(text, { to: 'en' });
//         return slugify(translatedText);
//     } catch (error) {
//         console.error('Google Translate API error:', error);
//         // 翻译失败时，回退到拼音模式
//         return getPinyinSlug(text);
//     }
// }

// /**
//  * 使用 pinyin-pro 将文本转换为拼音 slug
//  * @param text - 中文文本
//  * @returns 拼音 slug
//  */
// function getPinyinSlug(text: string): string {
//     const pinyinText = pinyin(text, { toneType: 'none' });
//     return slugify(pinyinText);
// }

// /**
//  * 根据配置模式自动转换文本为 slug
//  * @param text - 源文本
//  * @param mode - 转换模式 ('pinyin' 或 'google-translate')
//  * @returns slug 字符串
//  */
// export async function convertToSlug(
//     text: string,
//     mode: 'pinyin' | 'google-translate'
// ): Promise<string> {

//     if (settings.mode === 'pinyin') {
//       return getPinyinSlug(sourceText);
//     }

//     // 翻译模式
//     for (const engineType of settings.engineOrder) {
//       try {
//         const config = settings.engineConfigs[engineType] || {};
//         const translator = createTranslator(engineType, config);
//         const translatedText = await translator.translate(sourceText);

//         console.log(`Translation successful with ${engineType}.`);
//         return convertToSlug(translatedText); // 使用 slug-converter 清理并格式化

//       } catch (error) {
//         console.warn(`Translation with ${engineType} failed. Trying next engine...`, error);
//         continue; // 失败，尝试下一个
//       }
//     }

//     // 所有翻译引擎都失败，执行最终兜底
//     console.warn('All translation engines failed. Falling back to Pinyin.');
//     return getPinyinSlug(sourceText);
// }
