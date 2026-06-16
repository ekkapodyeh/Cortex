import { ClaudeLLMProvider } from './claude'

export interface LLMProvider {
  extractFeatures(code: string): Promise<import('@/lib/types').Feature[]>
  parseDocument(text: string): Promise<import('@/lib/types').Feature[]>
  extractConditions(items: { featureId: string; title: string; description: string }[]): Promise<Record<string, import('@/lib/types').Condition[]>>
}

export function createLLMProvider(): LLMProvider {
  return new ClaudeLLMProvider()
}
