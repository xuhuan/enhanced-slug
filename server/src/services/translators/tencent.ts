import { BaseTranslator, TranslationResult } from './BaseTranslator';

// 使用官方SDK
const tencentcloud = require("tencentcloud-sdk-nodejs-tmt");
const TmtClient = tencentcloud.tmt.v20180321.Client;

export class TencentTranslator extends BaseTranslator {
    private client: any;
    
    constructor(config: any) {
        super(config);
        this.initializeClient();
    }
    
    getName(): string {
        return 'tencent';
    }
    
    validateConfig(): boolean {
        return !!(this.config.secretId && this.config.secretKey);
    }
    
    private initializeClient(): void {
        if (!this.validateConfig()) {
            return;
        }
        
        const clientConfig = {
            credential: {
                secretId: this.config.secretId,
                secretKey: this.config.secretKey,
            },
            region: this.config.region || "ap-shanghai",
            profile: {
                httpProfile: {
                    endpoint: "tmt.tencentcloudapi.com",
                    timeout: 10, // 10秒超时
                },
            },
        };
        
        this.client = new TmtClient(clientConfig);
    }
    
    async translate(text: string, from: string = 'auto', to: string = 'en'): Promise<TranslationResult> {
        try {
            if (!this.validateConfig()) {
                throw new Error('Tencent translator config is invalid');
            }
            
            if (!this.client) {
                this.initializeClient();
            }
            
            if (!this.client) {
                throw new Error('Failed to initialize Tencent client');
            }
            
            const params = {
                SourceText: text,
                Source: from === 'auto' ? 'auto' : from,
                Target: to,
                ProjectId: parseInt(this.config.projectId || '0')
            };
            
            const response = await this.client.TextTranslate(params);
            
            // 检查响应是否有错误
            if (response.Error) {
                throw new Error(`Tencent API error: ${response.Error.Message} (Code: ${response.Error.Code})`);
            }
            
            // 检查是否有翻译结果
            if (!response.TargetText) {
                throw new Error('No translation result returned from Tencent API');
            }
            
            return {
                text: response.TargetText,
                success: true,
            };
            
        } catch (error: any) {
            console.error('Tencent translation error:', error);
            
            // 处理不同类型的错误
            let errorMessage = error.message;
            
            // SDK特有的错误格式
            if (error.code && error.message) {
                errorMessage = `${error.message} (Code: ${error.code})`;
            }
            
            return {
                text: '',
                success: false,
                error: errorMessage,
            };
        }
    }
    
    // 支持批量翻译（如果需要的话）
    async batchTranslate(texts: string[], from: string = 'auto', to: string = 'en'): Promise<TranslationResult[]> {
        const results: TranslationResult[] = [];
        
        // 腾讯云API支持批量翻译，但为了简化，这里使用串行处理
        // 实际使用中可以考虑并发处理或使用官方的批量接口
        for (const text of texts) {
            const result = await this.translate(text, from, to);
            results.push(result);
            
            // 添加小延迟避免频率限制
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return results;
    }
    
    // 获取支持的语言列表
    async getSupportedLanguages(): Promise<any> {
        try {
            if (!this.client) {
                this.initializeClient();
            }
            
            const response = await this.client.LanguageDetect({});
            return response;
        } catch (error) {
            console.error('Failed to get supported languages:', error);
            return null;
        }
    }
}