import axios from 'axios';
import crypto from 'crypto';
import { Translator, EngineConfig } from '../translators';

export class BaiduTranslator implements Translator {
    private readonly appId: string;
    private readonly secretKey: string;

    constructor(config: EngineConfig) {
        if (!config.appId || !config.secretKey) {
            throw new Error('Baidu translator requires appId and secretKey.');
        }
        this.appId = config.appId;
        this.secretKey = config.secretKey;
    }

    async translate(text: string): Promise<string> {
        const salt = Date.now().toString();
        const sign = crypto
            .createHash('md5')
            .update(this.appId + text + salt + this.secretKey)
            .digest('hex');

        try {
            const response = await axios.get('https://api.fanyi.baidu.com/api/trans/vip/translate', {
                params: {
                    q: text,
                    from: 'auto',
                    to: 'en',
                    appid: this.appId,
                    salt,
                    sign,
                },
            });

            if (response.data.error_code) {
                throw new Error(`Baidu API Error: ${response.data.error_msg}`);
            }

            return response.data.trans_result[0].dst;
        } catch (error) {
            console.error('Baidu Translate Error:', error);
            throw new Error('Baidu translation failed.');
        }
    }
}
