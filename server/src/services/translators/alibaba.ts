import * as $dara from '@darabonba/typescript';
import alimt, * as $alimt from '@alicloud/alimt20181012';
import { $OpenApiUtil } from '@alicloud/openapi-core';
import Credential, { Config } from '@alicloud/credentials';
import { BaseTranslator, TranslationResult } from './BaseTranslator';

export class AlibabaTranslator extends BaseTranslator {
  private client: alimt | null = null;

  getName(): string {
    return 'alibaba';
  }

  validateConfig(): boolean {
    // 对于阿里云SDK，appId对应AccessKeyId，appKey对应AccessKeySecret
    return !!(this.config.appId && this.config.appKey);
  }

  private createClient(): alimt {
    if (this.client) {
      return this.client;
    }

    console.log(this.config)

    // 使用AccessKey方式创建凭据
    const credentialsConfig = new Config({
      // 凭证类型。
      type: 'access_key',
      // 设置accessKeyId值，此处已从环境变量中获取accessKeyId为例。
      accessKeyId: this.config.appId,
      // 设置accessKeySecret值，此处已从环境变量中获取accessKeySecret为例。
      accessKeySecret: this.config.appKey,
    });
    const credentialClient = new Credential(credentialsConfig);

    const config = new $OpenApiUtil.Config({
      credential: credentialClient,
    });

    // 设置endpoint
    config.endpoint = 'mt.cn-hangzhou.aliyuncs.com';

    this.client = new alimt(config);
    return this.client;
  }

  async translate(
    text: string,
    from: string = 'auto',
    to: string = 'en'
  ): Promise<TranslationResult> {
    try {
      if (!this.validateConfig()) {
        throw new Error(
          'Alibaba translator config is invalid. Please provide appId (AccessKeyId) and appKey (AccessKeySecret).'
        );
      }

      const client = this.createClient();

      // 创建翻译请求 - 使用专业版title场景
      const translateRequest = new $alimt.TranslateRequest({
        formatType: 'text',
        targetLanguage: to,
        sourceLanguage: from === 'auto' ? 'auto' : from,
        sourceText: text,
        scene: 'title', // 专业版场景，适合标题翻译
      });

      // 运行时选项
      const runtime = new $dara.RuntimeOptions({
        readTimeout: 10000,
        connectTimeout: 5000,
        autoretry: true,
        maxAttempts: 2,
      });

      // 调用翻译API
      const response = await client.translateWithOptions(translateRequest, runtime);

      // 检查响应
      if (response.statusCode !== 200) {
        throw new Error(`Alibaba API error: HTTP ${response.statusCode}`);
      }

      if (!response.body?.data?.translated) {
        throw new Error('Alibaba API error: No translation result returned');
      }

      return {
        text: response.body.data.translated,
        success: true,
      };
    } catch (error: any) {
      // 处理ResponseError
      if (error instanceof $dara.ResponseError) {
        const responseError = error as $dara.ResponseError;
        console.error('Alibaba API ResponseError:', responseError.message);
        if (responseError.data?.Recommend) {
          console.error('Diagnostic URL:', responseError.data.Recommend);
        }
        return {
          text: '',
          success: false,
          error: `Alibaba API error: ${responseError.message}`,
        };
      }

      // 处理其他错误
      console.error('Alibaba translation error:', error);
      return {
        text: '',
        success: false,
        error: error.message || 'Unknown error occurred',
      };
    }
  }

  // 清理资源
  destroy(): void {
    this.client = null;
  }
}
