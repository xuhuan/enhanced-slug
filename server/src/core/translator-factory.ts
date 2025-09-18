import { Translator, EngineConfig, TranslationEngineType } from './translators';
import { GoogleTranslator } from './engines/google';
import { BaiduTranslator } from './engines/baidu';
// ... import other translators

export function createTranslator(engine: TranslationEngineType, config: EngineConfig): Translator {
    switch (engine) {
        case 'google':
            return new GoogleTranslator();
        case 'baidu':
            return new BaiduTranslator(config);
        // case 'deepl':
        //   return new DeepLTranslator(config);
        // ... other cases
        default:
            throw new Error(`Unsupported translation engine: ${engine}`);
    }
}
