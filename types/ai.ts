/**
 * AI 相关类型定义
 */

export interface AIProvider {
  name: string;
  generateCompletion(prompt: string, options?: AIOptions): Promise<AIResponse>;
  estimateCost(inputTokens: number, outputTokens: number): number;
}

export interface AIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIResponse {
  content: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
}
