export interface TranslatorConfig {
    appId?: string;
    appKey?: string;
    secretId?: string;
    secretKey?: string;
    apiKey?: string;
    region?: string;
    projectId?: string;
}

export interface TranslationResult {
    text: string;
    success: boolean;
    error?: string;
}

export abstract class BaseTranslator {
    protected config: TranslatorConfig;

    constructor(config: TranslatorConfig) {
        this.config = config;
    }

    abstract translate(text: string, from: string, to: string): Promise<TranslationResult>;
    abstract validateConfig(): boolean;
    abstract getName(): string;
}
