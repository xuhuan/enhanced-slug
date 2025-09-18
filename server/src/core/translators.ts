// 定义所有支持的引擎类型
export type TranslationEngineType =
    | 'google'
    | 'deepl'
    | 'baidu'
    | 'tencent'
    | 'alibaba'
    | 'volcengine';

// 定义每个引擎的配置接口
export interface EngineConfig {
    appId?: string;
    secretKey?: string;
    region?: string;
    // ... 其他可能的配置项
}

// 统一的翻译器接口
export interface Translator {
    translate(text: string): Promise<string>;
}
