import { describe, it, expect } from 'vitest'
import { extractTextFromBuffer } from '@/lib/file-parser'

describe('extractTextFromBuffer', () => {
  it('throws on unsupported file type', async () => {
    const buf = Buffer.from('hello')
    await expect(extractTextFromBuffer(buf, 'image.png')).rejects.toThrow('Unsupported file type')
  })

  it('accepts supported file types without throwing type error', async () => {
    const types = ['test.pdf', 'test.docx', 'test.xlsx', 'test.csv']
    for (const filename of types) {
      const buf = Buffer.from('')
      try {
        await extractTextFromBuffer(buf, filename)
      } catch (error: unknown) {
        // Should not throw "Unsupported file type" error
        const err = error as Error
        expect(err.message).not.toMatch(/Unsupported file type/)
      }
    }
  })
})
