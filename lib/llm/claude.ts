import Anthropic from '@anthropic-ai/sdk'
import type { LLMProvider } from './index'
import type { Feature } from '@/lib/types'

const EXTRACT_PROMPT = `Analyze the following codebase and extract a list of user-facing features.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title (short Thai/English), description (1-2 sentences Thai), category (optional grouping), subcategory (optional sub-grouping).

CRITICAL RULES for splitting features:
- 1 feature = 1 atomic user action (one Subject + one Verb + one Object)
- If a sentence contains multiple actions joined by "พร้อม", "และ", "หรือ", "and", "or", "also", "as well as" — split into SEPARATE features
- BAD: "ผู้ใช้เข้าสู่ระบบด้วย Username/Password พร้อม Remember Me ได้"
- GOOD: ["ผู้ใช้เข้าสู่ระบบด้วย Username/Password ได้", "ผู้ใช้ใช้ Remember Me ได้"]
- Each feature title must start with a clear actor and describe ONE action only

Example: [{"id":"uuid","title":"ผู้ใช้เข้าสู่ระบบด้วย Username/Password ได้","description":"ผู้ใช้สามารถเข้าสู่ระบบด้วย username และ password","category":"การเข้าสู่ระบบ"}]
Respond with ONLY the JSON array, no markdown, no explanation.`

const EXTRACT_CONDITIONS_PROMPT = `คุณได้รับรายการ user story แต่ละอัน จงแตก "เงื่อนไข" (acceptance conditions) ออกมาเป็น list ย่อย

กฎ:
- 1 condition = 1 เงื่อนไขที่ตรวจสอบได้อิสระ
- ถ้า description บอกว่า "username ต้องไม่ซ้ำ และ ไม่จำกัดความยาว" → แตกเป็น 2 conditions
- แต่ละ condition ต้องกระชับ ชัดเจน ตรวจสอบได้จากโค้ด
- ใช้ภาษาเดิมของ requirement (ไทยหรืออังกฤษ)

Return JSON object: { "[featureId]": [{ "id": "uuid", "description": "..." }, ...] }
ตอบด้วย JSON เท่านั้น ไม่มี markdown`

const PARSE_PROMPT = `Extract a feature list from the following document content.
Return ONLY a JSON array of features. Each feature must have: id (uuid), title, description, category (optional), subcategory (optional).

CRITICAL RULES for splitting features:
- 1 feature = 1 atomic user action (one Subject + one Verb + one Object)
- If a line or sentence contains multiple actions joined by "พร้อม", "และ", "หรือ", "and", "or", "also", "as well as" — split into SEPARATE features
- BAD: "ผู้ใช้เข้าสู่ระบบด้วย Username/Password พร้อม Remember Me ได้"
- GOOD: ["ผู้ใช้เข้าสู่ระบบด้วย Username/Password ได้", "ผู้ใช้ใช้ Remember Me ได้"]
- Each feature title must describe ONE user action only

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

  async extractConditions(items: { featureId: string; title: string; description: string }[]): Promise<Record<string, import('@/lib/types').Condition[]>> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: EXTRACT_CONDITIONS_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(items) }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
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
