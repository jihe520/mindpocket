import { convertHtml } from "../converter"
import { convertBilibili } from "./bilibili"
import { convertWechat } from "./wechat"
import { convertXiaohongshu } from "./xiaohongshu"

export interface ConvertResult {
  title: string | null
  markdown: string
}

/**
 * 根据平台选择不同的转换策略
 * - 特定平台使用自定义处理器
 * - 其他平台使用通用 MarkItDown 转换
 */
export async function convertWithPlatform(
  html: string,
  url: string,
  platform: string | null
): Promise<ConvertResult | null> {
  switch (platform) {
    case "bilibili":
      return await convertBilibili(html, url)
    case "wechat":
      return await convertWechat(html, url)
    case "xiaohongshu":
      return await convertXiaohongshu(html, url)
    default:
      return await convertHtml(html, url)
  }
}
