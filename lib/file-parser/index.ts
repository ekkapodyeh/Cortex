import { parsePdf } from './pdf'
import { parseDocx } from './docx'
import { parseXlsx } from './xlsx'

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split('.').pop()?.toLowerCase()

  if (ext === 'pdf') return parsePdf(buffer)
  if (ext === 'docx') return parseDocx(buffer)
  if (ext === 'xlsx' || ext === 'xls') return parseXlsx(buffer)
  if (ext === 'csv') return buffer.toString('utf-8')

  throw new Error(`Unsupported file type: .${ext}`)
}
