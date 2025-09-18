import { pinyin } from 'pinyin-pro';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class PinyinTranslator extends BaseTranslator {
    getName(): string {
        return 'pinyin';
    }

    validateConfig(): boolean {
        return true; // Pinyin doesn't require config
    }

    async translate(text: string, from?: string, to?: string): Promise<TranslationResult> {
        try {
            const result = pinyin(text, {
                toneType: 'none',
                type: 'array',
            });

            const slug = result
                .map(item => item.trim())
                .filter(item => item)
                .join('-')
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');

            return {
                text: slug,
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
