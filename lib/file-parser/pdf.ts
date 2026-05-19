import { PDFParse } from 'pdf-parse'

export async function parsePdf(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer })
  const data = await parser.getText()
  return data.text
}
