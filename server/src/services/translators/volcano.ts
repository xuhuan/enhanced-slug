import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class VolcanoTranslator extends BaseTranslator {
    private readonly API_URL = 'https://translate.volcengineapi.com/';

    getName(): string {
        return 'volcano';
    }

    validateConfig(): boolean {
        return !!(this.config.appId && this.config.appKey);
    }

    private getSignature(params: any, timestamp: string): string {
        const method = 'POST';
        const uri = '/';
        const query = '';
        const headers = `content-type:application/json\nhost:translate.volcengineapi.com\nx-date:${timestamp}`;
        const signedHeaders = 'content-type;host;x-date';

        const hashedPayload = CryptoJS.SHA256(JSON.stringify(params)).toString();

        const canonicalRequest = [
            method,
            uri,
            query,
            headers,
            '',
            signedHeaders,
            hashedPayload
        ].join('\n');

        const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString();

        const date = timestamp.split('T')[0].replace(/-/g, '');
        const credentialScope = `${date}/translate/request`;

        const stringToSign = [
            'HMAC-SHA256',
            timestamp,
            credentialScope,
            hashedCanonicalRequest
        ].join('\n');

        const signingKey = CryptoJS.HmacSHA256(
            'request',
            CryptoJS.HmacSHA256(
                'translate',
                CryptoJS.HmacSHA256(date, 'VOLC' + this.config.appKey)
            )
        );

        return CryptoJS.HmacSHA256(stringToSign, signingKey).toString();
    }

    async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
        try {
            if (!this.validateConfig()) {
                throw new Error('Volcano translator config is invalid');
            }

            const timestamp = new Date().toISOString().replace(/\.\d{3}/, '');
            const params = {
                SourceLanguage: from,
                TargetLanguage: to,
                TextList: [text],
            };

            const signature = this.getSignature(params, timestamp);

            const response = await axios.post(
                this.API_URL,
                params,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Date': timestamp,
                        'Authorization': `HMAC-SHA256 Credential=${this.config.appId}/${timestamp.split('T')[0].replace(/-/g, '')}/translate/request, SignedHeaders=content-type;host;x-date, Signature=${signature}`,
                    },
                    timeout: 10000,
                }
            );

            if (response.data.ResponseMetadata?.Error) {
                throw new Error(`Volcano API error: ${response.data.ResponseMetadata.Error.Message}`);
            }

            return {
                text: response.data.TranslationList[0].Translation,
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
