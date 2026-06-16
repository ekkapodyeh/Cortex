import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Condition, ConditionResult } from './types'

const PROMPT = `เปรียบเทียบ "conditions จาก Requirement" กับ "สิ่งที่โค้ดทำจริง" (feature description)

สำหรับแต่ละ condition ให้ตัดสินว่า:
- "match" = โค้ดทำตาม condition นี้ครบถ้วน
- "wrong" = โค้ดทำ แต่ไม่ตรงตาม condition (เช่น จำกัด 16 ตัวแทนที่ไม่จำกัด) — ใส่ note อธิบายว่าต่างกันยังไง
- "missing" = condition นี้ไม่มีในโค้ดเลย

ถ้าโค้ดมีอะไรที่ Requirement ไม่ได้ระบุ ให้ส่งกลับเป็น extra conditions

Return JSON:
{
  "results": [{ "id": "...", "description": "...", "status": "match|wrong|missing", "note": "อธิบายถ้า wrong" }],
  "extra": [{ "id": "extra-1", "description": "สิ่งที่โค้ดมีแต่ Req ไม่ได้ขอ", "status": "extra" }]
}
ตอบด้วย JSON เท่านั้น ไม่มี markdown ไม่มี backtick`

export async function compareConditions(
  conditions: Condition[],
  featureDescription: string
): Promise<ConditionResult[]> {
  if (conditions.length === 0) return []

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' })

  const result = await model.generateContent(
    `${PROMPT}\n\n${JSON.stringify({ conditions, featureDescription })}`
  )
  const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  const parsed = JSON.parse(text)
  return [...(parsed.results ?? []), ...(parsed.extra ?? [])]
}
