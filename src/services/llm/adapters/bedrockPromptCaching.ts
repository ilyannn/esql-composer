import type {
  ContentBlock,
  Message,
  SystemContentBlock,
} from "@aws-sdk/client-bedrock-runtime";

import { PreparedRequest } from "./types";

const MAX_BEDROCK_CACHE_POINTS = 4;
const DEFAULT_CACHE_POINT_TYPE = "default" as const;

const createContentBlock = (text: string): ContentBlock =>
  ({
    text,
  }) satisfies ContentBlock;

const createSystemContentBlock = (text: string): SystemContentBlock =>
  ({
    text,
  }) satisfies SystemContentBlock;

const createContentCachePoint = (): ContentBlock =>
  ({
    cachePoint: {
      type: DEFAULT_CACHE_POINT_TYPE,
    },
  }) satisfies ContentBlock;

const createSystemCachePoint = (): SystemContentBlock =>
  ({
    cachePoint: {
      type: DEFAULT_CACHE_POINT_TYPE,
    },
  }) satisfies SystemContentBlock;

const getLastAssistantMessageIndex = (
  messages: PreparedRequest["messages"],
): number =>
  messages.reduce(
    (lastAssistantIndex, message, index) =>
      message.role === "assistant" ? index : lastAssistantIndex,
    -1,
  );

const getCachedSystemIndexes = (
  systemLength: number,
  usedMessageCachePoints: number,
): Set<number> => {
  const maxSystemCachePoints = Math.max(
    0,
    MAX_BEDROCK_CACHE_POINTS - usedMessageCachePoints,
  );
  const startIndex = Math.max(0, systemLength - maxSystemCachePoints);

  return new Set(
    Array.from(
      { length: systemLength - startIndex },
      (_, offset) => startIndex + offset,
    ),
  );
};

export interface BedrockPreparedRequest {
  system: SystemContentBlock[];
  messages: Message[];
}

export const prepareBedrockRequest = (
  request: PreparedRequest,
  usePromptCaching = false,
): BedrockPreparedRequest => {
  if (!usePromptCaching) {
    return {
      system: request.system.map((block) => createSystemContentBlock(block.text)),
      messages: request.messages.map(
        (message) =>
          ({
            role: message.role,
            content: message.content.map((block) => createContentBlock(block.text)),
          }) satisfies Message,
      ),
    };
  }

  const lastAssistantMessageIndex = getLastAssistantMessageIndex(request.messages);
  const usedMessageCachePoints = lastAssistantMessageIndex >= 0 ? 1 : 0;
  const cachedSystemIndexes = getCachedSystemIndexes(
    request.system.length,
    usedMessageCachePoints,
  );

  return {
    system: request.system.flatMap((block, index) => {
      const content = [createSystemContentBlock(block.text)];
      if (cachedSystemIndexes.has(index)) {
        content.push(createSystemCachePoint());
      }
      return content;
    }),
    messages: request.messages.map((message, index) => {
      const content = message.content.map((block) => createContentBlock(block.text));

      if (index === lastAssistantMessageIndex && content.length > 0) {
        content.push(createContentCachePoint());
      }

      return {
        role: message.role,
        content,
      } satisfies Message;
    }),
  };
};
