# Enhanced Slug Plugin for Strapi v5 - 使用指南


## 配置指南

### 配置翻译引擎

1. 进入 Strapi 管理面板
2. 导航到 **设置 → Enhanced Slug**
3. 在"翻译引擎"标签页中配置各个翻译服务的凭证

#### 百度翻译配置

```
App ID: 你的百度翻译 App ID
App Key: 你的百度翻译密钥
```

获取方式：
1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册并创建应用
3. 获取 App ID 和密钥

#### 腾讯翻译配置

```
Secret ID: 你的腾讯云 Secret ID
Secret Key: 你的腾讯云 Secret Key
Region: ap-beijing (或其他地域)
Project ID: 0 (默认项目)
```

获取方式：
1. 访问 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 开通机器翻译服务
3. 在访问管理中创建密钥

#### 阿里云翻译配置

```
App ID: 你的阿里云 AccessKey ID
App Key: 你的阿里云 AccessKey Secret
```

#### DeepL 配置

```
API Key: 你的 DeepL API 密钥
```

注意：免费版和专业版的 API 端点不同，插件会自动识别。

#### 火山引擎配置

```
App ID: 你的火山引擎 Access Key ID
App Key: 你的火山引擎 Secret Access Key
```

#### 谷歌翻译

无需配置，使用免费的 google-translate-api-x 包。


## 高级配置

### 失败自动切换

启用"失败时自动切换"选项后，当所有翻译引擎都失败时，系统会自动使用拼音模式生成 slug。

### 优先级设置

翻译引擎的使用顺序按照在设置页面中启用的顺序：
1. 第一个启用的引擎优先使用
2. 失败后尝试下一个启用的引擎
3. 所有引擎失败后使用拼音（如果启用了自动切换）

## 故障排除

### 常见问题

1. **翻译失败**
   - 检查 API 凭证是否正确
   - 使用"测试连接"功能验证配置
   - 检查网络连接
   - 确认 API 配额是否充足

2. **中文转拼音不正确**
   - 确保已安装 pinyin-pro 包
   - 检查文本编码是否为 UTF-8

3. **TypeScript 错误**
   - 确保已安装所有 TypeScript 相关依赖
   - 运行 `npm install @strapi/typescript-utils`

### 调试模式

在开发环境中，可以查看详细日志：

```javascript
// server/src/services/slug.ts
strapi.log.debug('Translator response:', result);
```


## 更新升级

```bash
cd src/plugins/enhanced-slug
git pull origin main  # 如果使用 git
npm install
npm run build
cd ../../..
npm run build
```

## 技术支持

- 问题反馈：创建 Issue
- 功能建议：提交 Pull Request
- 文档改进：欢迎贡献

## 许可证

MIT License
