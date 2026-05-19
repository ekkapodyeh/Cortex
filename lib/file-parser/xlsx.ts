import * as XLSX from 'xlsx'

export function parseXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const lines: string[] = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    lines.push(XLSX.utils.sheet_to_csv(sheet))
  }
  return lines.join('\n')
}
