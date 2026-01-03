import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required')
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ClaudeResponse {
  content: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export async function callClaude(
  messages: ClaudeMessage[],
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
    systemPrompt?: string
  } = {}
): Promise<ClaudeResponse> {
  try {
    const {
      model = process.env.ANTHROPIC_LLM_MODEL || 'claude-sonnet-4-20250514',
      maxTokens = 1000,
      temperature = 0.7,
      systemPrompt,
    } = options

    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    return {
      content: content.text,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
    }
  } catch (error) {
    console.error('Error calling Claude API:', error)
    throw new Error('Failed to get response from AI assistant')
  }
}