import { translate } from 'google-translate-api-x';
import { Translator } from '../translators';

export class GoogleTranslator implements Translator {
    async translate(text: string): Promise<string> {
        try {
            const result = await translate(text, { to: 'en' });
            return result.text;
        } catch (error) {
            console.error('Google Translate Error:', error);
            throw new Error('Google translation failed.');
        }
    }
}
