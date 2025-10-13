import { BaseTranslator, TranslationResult } from './BaseTranslator';
import { translate } from '@vitalets/google-translate-api';

export class GoogleTranslator extends BaseTranslator {
  private translator: any;

  getName(): string {
    return 'google';
  }

  validateConfig(): boolean {
    return true;
  }

  async translate(
    text: string,
    from: string = 'auto',
    to: string = 'en'
  ): Promise<TranslationResult> {
    try {
      if (!this.translator) {
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
