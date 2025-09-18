import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class GoogleTranslator extends BaseTranslator {
    private translator: any;

    getName(): string {
        return 'google';
    }

    validateConfig(): boolean {
        return true; // Google Translate API doesn't require API key for google-translate-api-x
    }

    async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
        try {
            // Dynamic import to avoid loading the module until needed
            if (!this.translator) {
                const { translate } = await import('google-translate-api-x');
                this.translator = translate;
            }

            const result = await this.translator(text, {
                from: from === 'auto' ? 'auto' : from,
                to: to,
            });

            return {
                text: result.text,
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
