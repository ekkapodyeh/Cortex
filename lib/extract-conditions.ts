import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Condition } from './types'

const PROMPT = `คุณได้รับรายการ requirement แต่ละอัน จงแตก "เงื่อนไข" (acceptance conditions) ออกมาเป็น list ย่อย

กฎ:
- 1 condition = 1 เงื่อนไขที่ตรวจสอบได้อิสระ
- ถ้า description บอกว่า "username ต้องไม่ซ้ำ และ ไม่จำกัดความยาว" → แตกเป็น 2 conditions
- แต่ละ condition ต้องกระชับ ชัดเจน ตรวจสอบได้จากโค้ด
- ใช้ภาษาเดิมของ requirement (ไทยหรืออังกฤษ)
- id ให้ใช้รูปแบบ "cond-{featureId}-{n}" เช่น "cond-AUTH005-1"

Return JSON object: { "[featureId]": [{ "id": "...", "description": "..." }, ...] }
ตอบด้วย JSON เท่านั้น ไม่มี markdown ไม่มี backtick`

export async function extractConditionsForItems(
  items: { featureId: string; title: string; description: string }[]
): Promise<Record<string, Condition[]>> {
  if (items.length === 0) return {}

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

  const result = await model.generateContent(`${PROMPT}\n\n${JSON.stringify(items)}`)
  const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(text)
}
