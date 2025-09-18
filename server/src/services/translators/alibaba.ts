import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class AlibabaTranslator extends BaseTranslator {
    private readonly API_URL = 'https://mt.aliyuncs.com/';

    getName(): string {
        return 'alibaba';
    }

    validateConfig(): boolean {
        return !!(this.config.appId && this.config.appKey);
    }

    private getSignature(params: any): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');

        const stringToSign = `POST&%2F&${encodeURIComponent(sortedParams)}`;
        return CryptoJS.HmacSHA1(stringToSign, this.config.appKey + '&').toString(CryptoJS.enc.Base64);
    }

    async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
        try {
            if (!this.validateConfig()) {
                throw new Error('Alibaba translator config is invalid');
            }

            const params = {
                Action: 'TranslateGeneral',
                Version: '2018-10-12',
                AccessKeyId: this.config.appId,
                SignatureMethod: 'HMAC-SHA1',
                SignatureVersion: '1.0',
                SignatureNonce: Date.now().toString(),
                Timestamp: new Date().toISOString(),
                Format: 'JSON',
                SourceLanguage: from,
                TargetLanguage: to,
                SourceText: text,
                Scene: 'general',
            };

            const signature = this.getSignature(params);
            params['Signature'] = signature;

            const response = await axios.post(this.API_URL, null, {
                params,
                timeout: 10000,
            });

            if (response.data.Code !== '200') {
                throw new Error(`Alibaba API error: ${response.data.Message}`);
            }

            return {
                text: response.data.Data.Translated,
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
