import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class BaiduTranslator extends BaseTranslator {
    private readonly API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

    getName(): string {
        return 'baidu';
    }

    validateConfig(): boolean {
        return !!(this.config.appId && this.config.appKey);
    }

    async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
        try {
            if (!this.validateConfig()) {
                throw new Error('Baidu translator config is invalid');
            }

            const salt = Date.now().toString();
            const sign = CryptoJS.MD5(
                this.config.appId + text + salt + this.config.appKey
            ).toString();

            const response = await axios.get(this.API_URL, {
                params: {
                    q: text,
                    from,
                    to,
                    appid: this.config.appId,
                    salt,
                    sign,
                },
                timeout: 10000,
            });

            if (response.data.error_code) {
                throw new Error(`Baidu API error: ${response.data.error_msg}`);
            }

            return {
                text: response.data.trans_result[0].dst,
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
