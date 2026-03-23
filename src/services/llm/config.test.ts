import {
  defaultLLMConfig,
  FullLLMConfig,
  getAnthropicModelIndex,
  getBedrockModelIndex,
  isLLMConfigSufficent,
} from "./config";

describe("getAnthropicModelIndex", () => {
  it("should return 0 for Haiku", () => {
    expect(getAnthropicModelIndex("claude-haiku-4-5")).toBe(0);
  });

  it("should return 1 for Sonnet", () => {
    expect(getAnthropicModelIndex("claude-sonnet-4-6")).toBe(1);
  });

  it("should return 2 for Opus", () => {
    expect(getAnthropicModelIndex("claude-opus-4-6")).toBe(2);
  });

  it("should return 0 for unknown model", () => {
    expect(getAnthropicModelIndex("unknown-model" as any)).toBe(0);
  });
});

describe("getBedrockModelIndex", () => {
  it("should return 0 for Haiku", () => {
    expect(
      getBedrockModelIndex("anthropic.claude-haiku-4-5-20251001-v1:0"),
    ).toBe(0);
  });

  it("should return 1 for Sonnet", () => {
    expect(getBedrockModelIndex("anthropic.claude-sonnet-4-6")).toBe(1);
  });

  it("should return 2 for Opus", () => {
    expect(getBedrockModelIndex("anthropic.claude-opus-4-6-v1")).toBe(2);
  });

  it("should return 0 for unknown model", () => {
    expect(getBedrockModelIndex("unknown-model" as any)).toBe(0);
  });
});

describe("isLLMConfigSufficent", () => {
  const makeConfig = (overrides: Partial<FullLLMConfig>): FullLLMConfig => ({
    ...defaultLLMConfig,
    ...overrides,
  });

  describe("anthropic", () => {
    it("should return true with a valid API key", () => {
      const config = makeConfig({
        selected: "anthropic",
        anthropic: { ...defaultLLMConfig.anthropic, apiKey: "sk-ant-123" },
      });
      expect(isLLMConfigSufficent(config)).toBe(true);
    });

    it("should return false with empty API key", () => {
      expect(isLLMConfigSufficent(defaultLLMConfig)).toBe(false);
    });

    it("should return false with whitespace-only API key", () => {
      const config = makeConfig({
        selected: "anthropic",
        anthropic: { ...defaultLLMConfig.anthropic, apiKey: "   " },
      });
      expect(isLLMConfigSufficent(config)).toBe(false);
    });
  });

  describe("bedrock", () => {
    it("should return true with all fields filled", () => {
      const config = makeConfig({
        selected: "bedrock",
        bedrock: {
          ...defaultLLMConfig.bedrock,
          region: "us-east-1",
          accessKeyId: "AKIA123",
          secretAccessKey: "secret",
        },
      });
      expect(isLLMConfigSufficent(config)).toBe(true);
    });

    it("should return false with empty accessKeyId", () => {
      const config = makeConfig({
        selected: "bedrock",
        bedrock: {
          ...defaultLLMConfig.bedrock,
          region: "us-east-1",
          accessKeyId: "",
          secretAccessKey: "secret",
        },
      });
      expect(isLLMConfigSufficent(config)).toBe(false);
    });

    it("should return false with whitespace-only secretAccessKey", () => {
      const config = makeConfig({
        selected: "bedrock",
        bedrock: {
          ...defaultLLMConfig.bedrock,
          region: "us-east-1",
          accessKeyId: "AKIA123",
          secretAccessKey: "  ",
        },
      });
      expect(isLLMConfigSufficent(config)).toBe(false);
    });
  });

  describe("llamaServer", () => {
    it("should return true with a valid URL", () => {
      const config = makeConfig({ selected: "llamaServer" });
      expect(isLLMConfigSufficent(config)).toBe(true);
    });

    it("should return false with empty URL", () => {
      const config = makeConfig({
        selected: "llamaServer",
        llamaServer: { ...defaultLLMConfig.llamaServer, apiURL: "" },
      });
      expect(isLLMConfigSufficent(config)).toBe(false);
    });
  });

  describe("openAI", () => {
    it("should return true with URL and key", () => {
      const config = makeConfig({
        selected: "openAI",
        openAI: {
          ...defaultLLMConfig.openAI,
          apiKey: "sk-123",
        },
      });
      expect(isLLMConfigSufficent(config)).toBe(true);
    });

    it("should return false with empty key", () => {
      const config = makeConfig({ selected: "openAI" });
      expect(isLLMConfigSufficent(config)).toBe(false);
    });
  });
});
