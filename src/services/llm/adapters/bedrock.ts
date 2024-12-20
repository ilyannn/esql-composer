import {
  BedrockRuntimeClient,
  ConverseCommand,
  Message,
} from "@aws-sdk/client-bedrock-runtime";

import { LLMAdapter } from "./types";
import { BedrockLLMConfig } from "../config";

const createBedrockInstance = (
  region: string,
  keyID: string,
  keySecret: string
) => {
  return new BedrockRuntimeClient({
    region,
    credentials: {
      accessKeyId: keyID,
      secretAccessKey: keySecret,
    },
  });
};

export class BedrockLLMAdapter implements LLMAdapter {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor(private readonly config: BedrockLLMConfig) {
    this.client = createBedrockInstance(
      config.region,
      config.accessKeyId,
      config.secretAccessKey
    );
    this.modelId = config.modelName;
  }

  async answer(utterance: string): Promise<string> {
    const userMessage: Message = {
      role: "user",
      content: [{ text: utterance }],
    };

    const command = new ConverseCommand({
      modelId: this.modelId,
      messages: [userMessage],
      //      inferenceConfig: { maxTokens: 256, temperature: 0.5, topP: 0.9 },
    });

    try {
      const response = await this.client.send(command);
      const content = response?.output?.message?.content;
      if (!content) {
        throw new Error("No content in response");
      }
      const responseText = content[0].text;
      return responseText || "";
    } catch (err) {
      console.error(`ERROR: Can't invoke '${this.modelId}'. Reason: ${err}`);
      throw err;
    }
  }
}
