import { describe, expect, it } from "@jest/globals";

import { prepareBedrockRequest } from "./bedrockPromptCaching";
import { PreparedRequest } from "./types";

describe("prepareBedrockRequest", () => {
  it("does not add cache points when prompt caching is disabled", () => {
    const request: PreparedRequest = {
      system: [{ type: "text", text: "System prompt" }],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
    };

    expect(prepareBedrockRequest(request)).toEqual({
      system: [{ text: "System prompt" }],
      messages: [
        {
          role: "user",
          content: [{ text: "Hello" }],
        },
      ],
    });
  });

  it("adds cache points to the last assistant message and the newest system blocks", () => {
    const request: PreparedRequest = {
      system: [
        { type: "text", text: "System 1" },
        { type: "text", text: "System 2" },
      ],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Question" }],
        },
        {
          role: "assistant",
          content: [{ type: "text", text: "Answer" }],
        },
        {
          role: "user",
          content: [{ type: "text", text: "Follow-up" }],
        },
      ],
    };

    expect(prepareBedrockRequest(request, true)).toEqual({
      system: [
        { text: "System 1" },
        { cachePoint: { type: "default" } },
        { text: "System 2" },
        { cachePoint: { type: "default" } },
      ],
      messages: [
        {
          role: "user",
          content: [{ text: "Question" }],
        },
        {
          role: "assistant",
          content: [{ text: "Answer" }, { cachePoint: { type: "default" } }],
        },
        {
          role: "user",
          content: [{ text: "Follow-up" }],
        },
      ],
    });
  });

  it("limits Bedrock cache points to four checkpoints total", () => {
    const request: PreparedRequest = {
      system: [
        { type: "text", text: "System 1" },
        { type: "text", text: "System 2" },
        { type: "text", text: "System 3" },
        { type: "text", text: "System 4" },
        { type: "text", text: "System 5" },
      ],
      messages: [
        {
          role: "assistant",
          content: [{ type: "text", text: "Previous answer" }],
        },
      ],
    };

    expect(prepareBedrockRequest(request, true)).toEqual({
      system: [
        { text: "System 1" },
        { text: "System 2" },
        { text: "System 3" },
        { cachePoint: { type: "default" } },
        { text: "System 4" },
        { cachePoint: { type: "default" } },
        { text: "System 5" },
        { cachePoint: { type: "default" } },
      ],
      messages: [
        {
          role: "assistant",
          content: [
            { text: "Previous answer" },
            { cachePoint: { type: "default" } },
          ],
        },
      ],
    });
  });

  it("uses all cache points for system prompts when there is no assistant history", () => {
    const request: PreparedRequest = {
      system: [
        { type: "text", text: "System 1" },
        { type: "text", text: "System 2" },
        { type: "text", text: "System 3" },
        { type: "text", text: "System 4" },
        { type: "text", text: "System 5" },
      ],
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: "Hello" }],
        },
      ],
    };

    expect(prepareBedrockRequest(request, true)).toEqual({
      system: [
        { text: "System 1" },
        { text: "System 2" },
        { cachePoint: { type: "default" } },
        { text: "System 3" },
        { cachePoint: { type: "default" } },
        { text: "System 4" },
        { cachePoint: { type: "default" } },
        { text: "System 5" },
        { cachePoint: { type: "default" } },
      ],
      messages: [
        {
          role: "user",
          content: [{ text: "Hello" }],
        },
      ],
    });
  });
});
