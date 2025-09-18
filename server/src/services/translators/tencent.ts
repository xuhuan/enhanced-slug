import axios from 'axios';
import * as CryptoJS from 'crypto-js';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class TencentTranslator extends BaseTranslator {
    private readonly API_URL = 'https://tmt.tencentcloudapi.com/';

    getName(): string {
        return 'tencent';
    }

    validateConfig(): boolean {
        return !!(this.config.secretId && this.config.secretKey);
    }

    private getSignature(params: any, timestamp: string): string {
        const method = 'POST';
        const endpoint = 'tmt.tencentcloudapi.com';
        const region = this.config.region || 'ap-beijing';
        const action = 'TextTranslate';
        const version = '2018-03-21';

        const canonicalRequest = [
            method,
            '/',
            '',
            'content-type:application/json',
            'host:' + endpoint,
            '',
            'content-type;host',
            CryptoJS.SHA256(JSON.stringify(params)).toString()
        ].join('\n');

        const date = new Date(parseInt(timestamp) * 1000).toISOString().substr(0, 10);
        const credentialScope = `${date}/tmt/tc3_request`;

        const stringToSign = [
            'TC3-HMAC-SHA256',
            timestamp,
            credentialScope,
            CryptoJS.SHA256(canonicalRequest).toString()
        ].join('\n');

        const secretDate = CryptoJS.HmacSHA256(date, 'TC3' + this.config.secretKey);
        const secretService = CryptoJS.HmacSHA256('tmt', secretDate);
        const secretSigning = CryptoJS.HmacSHA256('tc3_request', secretService);
        const signature = CryptoJS.HmacSHA256(stringToSign, secretSigning).toString();

        return signature;
    }

    async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
        try {
            if (!this.validateConfig()) {
                throw new Error('Tencent translator config is invalid');
            }

            const timestamp = Math.floor(Date.now() / 1000).toString();
            const params = {
                SourceText: text,
                Source: from,
                Target: to,
                ProjectId: parseInt(this.config.projectId || '0'),
            };

            const signature = this.getSignature(params, timestamp);
            const date = new Date(parseInt(timestamp) * 1000).toISOString().substr(0, 10);

            const response = await axios.post(
                this.API_URL,
                params,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-TC-Action': 'TextTranslate',
                        'X-TC-Version': '2018-03-21',
                        'X-TC-Timestamp': timestamp,
                        'X-TC-Region': this.config.region || 'ap-beijing',
                        'Authorization': `TC3-HMAC-SHA256 Credential=${this.config.secretId}/${date}/tmt/tc3_request, SignedHeaders=content-type;host, Signature=${signature}`,
                    },
                    timeout: 10000,
                }
            );

            if (response.data.Response.Error) {
                throw new Error(`Tencent API error: ${response.data.Response.Error.Message}`);
            }

            return {
                text: response.data.Response.TargetText,
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
