import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'
import type { Feature } from '@/lib/types'

const DIAGRAM_PROMPT = `คุณเป็นผู้เชี่ยวชาญด้าน Software Architecture ที่สร้าง Mermaid flowchart diagrams

จากรายการฟีเจอร์ที่ให้มา ให้สร้าง Mermaid flowchart diagram แบบ swimlane ที่แสดงการทำงานของฟีเจอร์ทั้งหมดในหมวดหมู่นี้

กฎการสร้าง:
- ใช้ flowchart TD (top-down)
- แบ่งเป็น subgraph สำหรับแต่ละ actor: User, Frontend, Backend, Database (ใช้เฉพาะที่จำเป็น)
- แสดง flow การทำงานตามลำดับจาก feature descriptions
- ใช้ภาษาไทยสำหรับ label
- node id ใช้ตัวอักษรภาษาอังกฤษเท่านั้น (ไม่มีเว้นวรรค)
- ตอบด้วย Mermaid code เท่านั้น ไม่มี markdown fence ไม่มี explanation`

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params
  const { category } = await req.json()

  if (!category) {
    return NextResponse.json({ error: 'category required' }, { status: 400 })
  }

  const project = await db.project.findUnique({ where: { id } })
  if (!project) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const latestDoc = await db.knowledgeDoc.findFirst({
    where: { projectId: id },
    orderBy: { version: 'desc' },
  })
  if (!latestDoc) return NextResponse.json({ error: 'no knowledge doc' }, { status: 404 })

  const features = (latestDoc.features as unknown as Feature[]) ?? []
  const categoryFeatures = features.filter((f) => (f.category ?? 'ทั่วไป') === category)
  if (categoryFeatures.length === 0) {
    return NextResponse.json({ error: 'no features in category' }, { status: 404 })
  }

  // Already has diagram — return cached
  const existing = categoryFeatures.find((f) => f.flowDiagram)?.flowDiagram
  if (existing) return NextResponse.json({ diagram: existing })

  // Generate with Claude
  console.log('[generate-diagram] generating for category:', category, 'features:', categoryFeatures.length)
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const featureList = categoryFeatures
    .map((f, i) => `${i + 1}. ${f.title}: ${f.description}`)
    .join('\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: DIAGRAM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `หมวดหมู่: ${category}\n\nฟีเจอร์:\n${featureList}`,
      },
    ],
  })

  const diagram = response.content[0].type === 'text' ? response.content[0].text.trim() : ''

  // Cache: store in the first feature of this category
  const updatedFeatures = features.map((f) => {
    if (f.id === categoryFeatures[0].id) return { ...f, flowDiagram: diagram }
    return f
  })

  await db.knowledgeDoc.update({
    where: { id: latestDoc.id },
    data: { features: updatedFeatures as unknown as object[] },
  })

  console.log('[generate-diagram] done, diagram length:', diagram.length)
  return NextResponse.json({ diagram })
  } catch (err) {
    console.error('[generate-diagram] error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
