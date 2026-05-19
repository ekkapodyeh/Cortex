import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { extractTextFromBuffer } from '@/lib/file-parser'
import { createLLMProvider } from '@/lib/llm'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const projectId = formData.get('projectId') as string
  const uploadedBy = (formData.get('uploadedBy') as string) ?? 'PM'

  if (!file || !projectId) {
    return NextResponse.json({ error: 'file and projectId required' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const text = await extractTextFromBuffer(buffer, file.name)

  const llm = createLLMProvider()
  const features = await llm.parseDocument(text)

  const last = await db.documentRequirement.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
  })
  const version = (last?.version ?? 0) + 1

  const requirement = await db.documentRequirement.create({
    data: { projectId, version, features: features as any, createdBy: uploadedBy },
  })

  return NextResponse.json(requirement, { status: 201 })
}
