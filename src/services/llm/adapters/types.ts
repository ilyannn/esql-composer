export interface LLMAdapter {
    countTokens(text: string): Promise<number>;
    answer(utterance: string): Promise<string>;
    //    streamMessages(messages: string[]): AsyncIterable<string>;
}

