/**
 * 将字符串转换为 URL 友好的 slug 格式
 * @param text - 输入字符串
 * @returns slug 格式的字符串
 */

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // 将空格替换为 -
    .replace(/[^\w-]+/g, '') // 移除所有非单词字符
    .replace(/--+/g, '-') // 将多个 - 替换为单个 -
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的 -
}
