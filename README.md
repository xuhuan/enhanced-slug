# Enhanced Slug Plugin for Strapi v5

The interface is used to translate specified fields, primarily for the slug field, to facilitate the generation of frontend URLs.

The suggestion is primarily intended for fields such as titles.

Aliyun's Professional Translation Edition offers specialized scenarios suitable for title translation, so the API call utilizes the Professional Edition. Both the Professional and General Editions share the same free quota under the same account.

## Feature List
- Supports translation and pinyin modes
- The translation interface supports priority modes and load balancing modes for multiple channels
- If the translation interface fails, you can fall back to using pinyin
- The translation interface allows setting priorities and can be configured with monthly character limits
- Supports tracking character usage via the interface and manual reset of usage
- The interface supports bilingual Chinese-English

## Installation method

Simply install the plugin

```
npm i enhanced-slug
```

```
pnpm i enhanced-slug
```

```
yarn add enhanced-slug
```

## Usage method

This is a component, choose custom component when adding it

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/use-en.png width=800/>

Below is the input box effect and usage effect. When the content of the associated field changes, it will automatically trigger the generation. You can also manually click the button to trigger the generation, or modify the final slug component content yourself.

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/use-en2.png width=800/>

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/use-en3.png width=800/>

## Configuration Interface
<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/setting-en.png width=800/>
<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/setting-en2.png width=800/>
<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/setting-en3.png width=800/>

## Configuration Guide

### Configuring the Translation Engine

1. Access the Strapi admin panel.
2. Navigate to **Settings → Enhanced Slug**
3. Configure the credentials for each translation service in the "Translation Engine" tab.


#### Configuring Tencent Translation

Free quota: 5 million characters per month

```
Secret ID: Your Tencent Cloud Secret ID
Secret Key: Your Tencent Cloud Secret Key
Region: ap-beijing (or other region)
Project ID: 0 (default project)
```

How to obtain:
1. Visit the [Tencent Cloud Console](https://console.cloud.tencent.com/)
2. Activate the machine translation service
3. Create a key in Access Management

#### Configuring Alibaba Cloud Translation

Free quota: 1 million characters per month

```
App ID: Your Alibaba Cloud AccessKey ID
App Key: Your Alibaba Cloud AccessKey Secret
```

#### Google Translate

No configuration required, uses the free @vitalets/google-translate-api package.


### Advanced Configuration

### Automatically Switch on Failure

Enabling the "Automatically Switch on Failure" option automatically generates a slug using Pinyin mode when all translation engines fail.
### Priority Settings

Translation engines are used in the order they are enabled in the settings page:
1. The first enabled engine takes precedence.
2. If it fails, the next enabled engine is tried.
3. If all engines fail, Pinyin is used (if automatic switching is enabled).

## Troubleshooting

### Common Problems

1. **Translation Failure**
- Check that the API credentials are correct.
- Use the "Test Connection" function to verify the configuration.
- Check network connectivity.
- Verify that the API quota is sufficient.

2. **Chinese to Pinyin Conversion Error**
- Ensure the pinyin-pro package is installed.
- Check that the text encoding is UTF-8.

3. **TypeScript Error**
- Ensure all TypeScript dependencies are installed.

### Debug Mode

In the development environment, you can view detailed logs:


```javascript
// server/src/services/slug.ts
strapi.log.debug('Translator response:', result);
```
## Technical Support

- Report Issues: Create an Issue
- Feature Suggestions: Submit a Pull Request
- Documentation Improvements: Contributions are welcome

## Contact And Support Author

You can follow my WeChat official account for support.

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/fifthtimezone.jpg width=200/>

You can also add me as your WeChat friend.

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/wechat.png width=200/>

Yes, I work for a travel agency. If you'd like to book a tour with me, I wouldn't refuse.

## License

MIT License



# 中文介绍

调用接口对指定字段进行翻译，主要用于slug字段，方便前端url地址的生成。

建议主要用于标题这类类型的字段。

阿里云翻译专业版有专门的场景适合标题翻译，所以阿里云接口调用的是专业版，专业版和通用版是共享账号的免费额度。

## 功能列表
- 支持翻译和拼音模式
- 翻译接口支持多渠道的优先级模式和负载均衡模式
- 翻译接口失败可以选用拼音兜底
- 翻译接口可以设置优先级，可以按月设置字符限额
- 支持统计接口字符使用量，以及手动重置使用量
- 界面支持中英双语

## 安装方法

安装插件即可

```
npm i enhanced-slug
```
```
pnpm i enhanced-slug
```
```
yarn add enhanced-slug
```

## 使用方法

这个是组件，添加的时候选择自定义组件

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/use-en.png width=800/>

下面是输入框效果和使用效果，关联字段内容变更后会自动触发生成，也可以手动点击按钮触发生成，或者自行修改最终的slug组件内容。

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/use2.png width=800/>

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/use3.png width=800/>

## 配置界面

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/setting.png width=800/>
<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/setting2.png width=800/>
<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/setting3.png width=800/>

## 配置指南

### 配置翻译引擎

1. 进入 Strapi 管理面板
2. 导航到 **设置 → Enhanced Slug**
3. 在"翻译引擎"标签页中配置各个翻译服务的凭证


#### 腾讯翻译配置

免费额度每月500万字符

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

免费额度每月100万字符

```
App ID: 你的阿里云 AccessKey ID
App Key: 你的阿里云 AccessKey Secret
```


#### 谷歌翻译

无需配置，使用免费的 @vitalets/google-translate-api 包。


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

### 调试模式

在开发环境中，可以查看详细日志：

```javascript
// server/src/services/slug.ts
strapi.log.debug('Translator response:', result);
```

## 技术支持

- 问题反馈：创建 Issue
- 功能建议：提交 Pull Request
- 文档改进：欢迎贡献

## 联系并支持作者

可以关注我的微信公众号支持一下。

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/fifthtimezone.jpg width=200/>


也可以加我的微信好友。

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/wechat.png width=200/>


没错，作者是旅行社的，你们要是愿意找我报团我也是不会拒绝的~

## 许可证

MIT License
