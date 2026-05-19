import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider } from './index'
import type { Feature } from '@/lib/types'

const EXTRACT_PROMPT = `Analyze the following codebase and extract a list of user-facing features.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title (short Thai/English), description (1-2 sentences Thai), category (optional grouping).
Example: [{"id":"uuid","title":"เข้าสู่ระบบด้วย Username/Password","description":"ผู้ใช้สามารถเข้าสู่ระบบด้วย username และ password","category":"การเข้าสู่ระบบ"}]
Respond with ONLY the JSON array, no markdown, no explanation.`

const PARSE_PROMPT = `Extract a feature list from the following document content.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title, description, category (optional).
Respond with ONLY the JSON array, no markdown, no explanation.`

export class ClaudeLLMProvider implements LLMProvider {
  private client: Anthropic

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async extractFeatures(code: string): Promise<Feature[]> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: EXTRACT_PROMPT,
      messages: [{ role: 'user', content: code.slice(0, 100000) }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return JSON.parse(text)
  }

  async parseDocument(text: string): Promise<Feature[]> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: PARSE_PROMPT,
      messages: [{ role: 'user', content: text.slice(0, 50000) }],
    })
    const out = response.content[0].type === 'text' ? response.content[0].text : '[]'
    return JSON.parse(out)
  }
}
