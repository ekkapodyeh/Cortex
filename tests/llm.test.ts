import { describe, it, expect } from 'vitest'
import { createLLMProvider } from '@/lib/llm'

describe('LLM provider', () => {
  it('creates a provider instance', () => {
    const provider = createLLMProvider()
    expect(provider).toBeDefined()
    expect(typeof provider.extractFeatures).toBe('function')
    expect(typeof provider.parseDocument).toBe('function')
  })
})
