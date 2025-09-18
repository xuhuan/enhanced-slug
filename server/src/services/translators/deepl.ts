import axios from 'axios';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class DeepLTranslator extends BaseTranslator {
    private readonly API_URL = 'https://api-free.deepl.com/v2/translate';
    private readonly API_URL_PRO = 'https://api.deepl.com/v2/translate';

    getName(): string {
        return 'deepl';
    }

    validateConfig(): boolean {
        return !!this.config.apiKey;
    }

    async translate(text: string, from: string = 'auto', to: string = 'EN'): Promise<TranslationResult> {
        try {
            if (!this.validateConfig()) {
                throw new Error('DeepL translator config is invalid');
            }

            const isPro = this.config.apiKey?.endsWith(':dp');
            const apiUrl = isPro ? this.API_URL_PRO : this.API_URL;

            const response = await axios.post(
                apiUrl,
                new URLSearchParams({
                    auth_key: this.config.apiKey!,
                    text: text,
                    source_lang: from === 'auto' ? '' : from.toUpperCase(),
                    target_lang: to.toUpperCase(),
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: 10000,
                }
            );

            if (!response.data.translations || response.data.translations.length === 0) {
                throw new Error('No translation result from DeepL');
            }

            return {
                text: response.data.translations[0].text,
                success: true,
            };
        } catch (error: any) {
            return {
                text: '',
                success: false,
                error: error.message,
            };
        }
    }
}
