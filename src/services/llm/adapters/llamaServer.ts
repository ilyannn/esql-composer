import { LLMAdapter } from "./types";
import { LlamaServerLLMConfig } from "../config";

export class LlamaServerLLMAdapter implements LLMAdapter {
  private readonly apiURL: string;
  private readonly apiKey: string;

  constructor(private readonly config: LlamaServerLLMConfig) {
    this.apiURL = config.apiURL;
    this.apiKey = config.apiKey;
  }

  async countTokens(text: string): Promise<number> {
    const url = this.apiURL + "/tokenize";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ content: text }),
    });

    const result = await response.json();
    return result.tokens.length();
  }

  async answer(utterance: string): Promise<string> {
    const url = this.apiURL + "/completion";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ prompt: utterance, n_predict: 256 }),
    });

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    return data.content;
  }
}
