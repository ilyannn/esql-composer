export interface LLMAdapter {
  answer(utterance: string): Promise<string>;
  countTokens?(text: string): Promise<number>;
  //    streamMessages(messages: string[]): AsyncIterable<string>;
}

