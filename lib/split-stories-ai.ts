// ตัวแบ่ง compound stories แบบ rule-based (ไม่ใช้ AI)
// แบ่งเมื่อ title มี pattern ที่บ่งบอกว่ามีหลาย feature อิสระ

// คำที่ใช้เชื่อม compound features
const SPLIT_PATTERNS = [
  // "X พร้อม Y" → ["X", "Y"]
  /^(.+?)\s+พร้อม\s+(.+)$/,
  // "X และ Y" เมื่อทั้งสองฝั่งยาวพอ (> 5 ตัวอักษร)
  /^(.{5,}?)\s+และ\s+(.{5,})$/,
  // "X / Y" เมื่อทั้งสองฝั่งเป็น feature ชัดเจน
  /^(.{5,}?)\s*\/\s*(.{5,})$/,
]

function trySplit(title: string): string[] | null {
  for (const pattern of SPLIT_PATTERNS) {
    const m = title.match(pattern)
    if (m) return [m[1].trim(), m[2].trim()]
  }
  return null
}

export async function splitStoriesWithAI(items: any[]): Promise<any[]> {
  if (items.length === 0) return []

  const result: any[] = []
  for (const item of items) {
    const parts = trySplit(item.title ?? '')
    if (parts && parts.length >= 2) {
      parts.forEach((part, i) => {
        result.push({
          ...item,
          featureId: `${item.featureId}-part${i + 1}`,
          title: part,
          conditions: [],
        })
      })
    } else {
      result.push(item)
    }
  }
  return result
}
