import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import _ from "lodash";
import React from "react";
import LLMConfigurationArea from "./LLMConfigurationArea";
import { defaultLLMConfig, FullLLMConfig } from "../services/llm/config";

const makeConfig = (overrides: Partial<FullLLMConfig> = {}): FullLLMConfig =>
  _.merge(_.cloneDeep(defaultLLMConfig), overrides);

const renderArea = (
  overrides: Partial<React.ComponentProps<typeof LLMConfigurationArea>> = {},
) => {
  const props: React.ComponentProps<typeof LLMConfigurationArea> = {
    llmConfig: makeConfig(),
    setLLMConfig: jest.fn(),
    tooltipsShown: false,
    isAbleToTest: false,
    performTest: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  const view = render(
    <ChakraProvider>
      <LLMConfigurationArea {...props} />
    </ChakraProvider>,
  );

  return {
    ...view,
    props,
  };
};

describe("LLMConfigurationArea", () => {
  it("renders the Anthropic configuration by default and can switch tabs", async () => {
    const user = userEvent.setup();
    const { props } = renderArea();

    expect(screen.getByLabelText("Anthropic API Key")).toBeInTheDocument();
    expect(screen.getByText("Compare model pricing.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Test" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "Bedrock (beta)" }));

    expect(props.setLLMConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        selected: "bedrock",
      }),
    );
  });

  it("updates the Anthropic API key through input events", () => {
    const llmConfig = makeConfig({
      anthropic: {
        ...defaultLLMConfig.anthropic,
        isKnownToWork: true,
      },
    });
    const { props } = renderArea({ llmConfig });

    const input = screen.getByLabelText("Anthropic API Key");
    fireEvent.change(input, { target: { value: "sk-ant-change" } });
    fireEvent.blur(input, { target: { value: "sk-ant-blur" } });

    expect(props.setLLMConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        anthropic: expect.objectContaining({
          apiKey: "sk-ant-blur",
          isKnownToWork: undefined,
        }),
      }),
    );
  });

  it("loads the Anthropic API key from a dropped file", async () => {
    const originalFileReader = global.FileReader;

    class MockFileReader {
      onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
      onerror: (() => void) | null = null;

      readAsText(_file: Blob) {
        this.onload?.({
          target: { result: JSON.stringify({ apiKey: "sk-ant-dropped" }) },
        } as ProgressEvent<FileReader>);
      }
    }

    global.FileReader = MockFileReader as unknown as typeof FileReader;

    try {
      const { props } = renderArea();
      const input = screen.getByLabelText("Anthropic API Key");
      const file = new File(["ignored"], "anthropic-key.json", {
        type: "application/json",
      });
      const files = {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
      };

      fireEvent.dragEnter(input);
      fireEvent.dragOver(input, {
        dataTransfer: {
          dropEffect: "none",
          files,
        },
      });

      expect(input).toHaveStyle({
        cursor: "copy",
      });

      fireEvent.drop(input, {
        dataTransfer: {
          files,
        },
      });

      await waitFor(() => {
        expect(props.setLLMConfig).toHaveBeenCalledWith(
          expect.objectContaining({
            anthropic: expect.objectContaining({
              apiKey: "sk-ant-dropped",
              isKnownToWork: undefined,
            }),
          }),
        );
      });
    } finally {
      global.FileReader = originalFileReader;
    }
  });

  it("updates the Bedrock configuration fields", () => {
    const { props } = renderArea({
      llmConfig: makeConfig({
        selected: "bedrock",
      }),
    });

    fireEvent.change(screen.getByLabelText("AWS Region"), {
      target: { value: "eu-central-1" },
    });
    fireEvent.change(screen.getByLabelText("AWS Access Key ID"), {
      target: { value: "AKIA123" },
    });
    fireEvent.change(screen.getByLabelText("AWS Secret Access Key"), {
      target: { value: "secret-456" },
    });

    expect(props.setLLMConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        bedrock: expect.objectContaining({
          region: "us-east-1",
          accessKeyId: "",
          secretAccessKey: "secret-456",
          isKnownToWork: undefined,
        }),
      }),
    );
  });

  it("updates the llama-server fields", () => {
    const { props } = renderArea({
      llmConfig: makeConfig({
        selected: "llamaServer",
      }),
    });

    fireEvent.change(screen.getByLabelText("Server Endpoint"), {
      target: { value: "http://localhost:9000" },
    });
    fireEvent.input(screen.getByLabelText("API Key"), {
      currentTarget: { value: "llama-secret" },
      target: { value: "llama-secret" },
    });

    expect(props.setLLMConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        llamaServer: expect.objectContaining({
          apiURL: "http://localhost:9000",
          isKnownToWork: undefined,
        }),
      }),
    );
    expect(props.setLLMConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        llamaServer: expect.objectContaining({
          apiKey: "llama-secret",
          isKnownToWork: undefined,
        }),
      }),
    );
  });

  it("runs the test action when enabled", async () => {
    const user = userEvent.setup();
    const performTest = jest.fn().mockResolvedValue(undefined);

    renderArea({
      isAbleToTest: true,
      performTest,
    });

    await user.click(screen.getByRole("button", { name: "Test" }));

    await waitFor(() => {
      expect(performTest).toHaveBeenCalledTimes(1);
    });
  });
});
