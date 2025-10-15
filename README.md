# Enhanced Slug Plugin for Strapi v5 - 使用指南

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

## 联系支持作者

可以关注我的公众号支持一下。

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/fifthtimezone.jpg width=200/>
 

也可以加我的微信好友。

<img src=https://raw.githubusercontent.com/xuhuan/enhanced-slug/refs/heads/main/doc/images/wechat.png width=200/>


没错，作者是旅行社的，你们要是愿意找我报团我也是不会拒绝的~

## 许可证

MIT License
