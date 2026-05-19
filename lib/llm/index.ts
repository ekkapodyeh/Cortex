import { ClaudeLLMProvider } from './claude'

export interface LLMProvider {
  extractFeatures(code: string): Promise<import('@/lib/types').Feature[]>
  parseDocument(text: string): Promise<import('@/lib/types').Feature[]>
}

export function createLLMProvider(): LLMProvider {
  return new ClaudeLLMProvider()
}
