import { ChakraProvider } from "@chakra-ui/react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import React from "react";
import LLMConfigurationArea from "./LLMConfigurationArea";
import {
  defaultLLMConfig,
  FullLLMConfig,
  mergeLLMConfig,
} from "../services/llm/config";

const makeConfig = (overrides: Partial<FullLLMConfig> = {}): FullLLMConfig =>
  mergeLLMConfig(overrides);

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

const getSetLLMConfigMock = (
  props: React.ComponentProps<typeof LLMConfigurationArea>,
): jest.Mock => props.setLLMConfig as unknown as jest.Mock;

const mockFileReader = (
  implementation: (instance: {
    onload: ((event: ProgressEvent<FileReader>) => void) | null;
    onerror: (() => void) | null;
  }) => void,
) => {
  const originalFileReader = global.FileReader;

  class MockFileReader {
    onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
    onerror: (() => void) | null = null;

    readAsText(_file: Blob) {
      implementation(this);
    }
  }

  global.FileReader = MockFileReader as unknown as typeof FileReader;

  return () => {
    global.FileReader = originalFileReader;
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
    const restoreFileReader = mockFileReader((instance) => {
      instance.onload?.({
        target: { result: JSON.stringify({ apiKey: "sk-ant-dropped" }) },
      } as ProgressEvent<FileReader>);
    });

    try {
      const { props } = renderArea();
      const setLLMConfigMock = getSetLLMConfigMock(props);
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
      expect(input).toHaveStyle({
        cursor: "copy",
      });

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

      fireEvent.dragLeave(input);

      await waitFor(() => {
        expect(setLLMConfigMock).toHaveBeenCalledWith(
          expect.objectContaining({
            anthropic: expect.objectContaining({
              apiKey: "sk-ant-dropped",
              isKnownToWork: undefined,
            }),
          }),
        );
      });
    } finally {
      restoreFileReader();
    }
  });

  it("surfaces an error toast when a dropped Anthropic file has no usable key", async () => {
    const restoreFileReader = mockFileReader((instance) => {
      instance.onload?.({
        target: { result: "   " },
      } as ProgressEvent<FileReader>);
    });

    try {
      const { props } = renderArea();
      const setLLMConfigMock = getSetLLMConfigMock(props);
      const initialCallCount = setLLMConfigMock.mock.calls.length;
      const input = screen.getByLabelText("Anthropic API Key");
      const file = new File(["ignored"], "anthropic-key.json", {
        type: "application/json",
      });

      fireEvent.drop(input, {
        dataTransfer: {
          files: {
            0: file,
            length: 1,
            item: (index: number) => (index === 0 ? file : null),
          },
        },
      });

      await waitFor(() => {
        expect(setLLMConfigMock.mock.calls.length).toBe(initialCallCount);
      });
    } finally {
      restoreFileReader();
    }
  });

  it("surfaces an error toast when reading a dropped Anthropic file fails", async () => {
    const restoreFileReader = mockFileReader((instance) => {
      instance.onerror?.();
    });

    try {
      const { props } = renderArea();
      const setLLMConfigMock = getSetLLMConfigMock(props);
      const initialCallCount = setLLMConfigMock.mock.calls.length;
      const input = screen.getByLabelText("Anthropic API Key");
      const file = new File(["ignored"], "anthropic-key.json", {
        type: "application/json",
      });

      fireEvent.drop(input, {
        dataTransfer: {
          files: {
            0: file,
            length: 1,
            item: (index: number) => (index === 0 ? file : null),
          },
        },
      });

      await waitFor(() => {
        expect(setLLMConfigMock.mock.calls.length).toBe(initialCallCount);
      });
    } finally {
      restoreFileReader();
    }
  });

  it("ignores drops without a file on the Anthropic input", () => {
    const { props } = renderArea();
    const setLLMConfigMock = getSetLLMConfigMock(props);
    const initialCallCount = setLLMConfigMock.mock.calls.length;
    const input = screen.getByLabelText("Anthropic API Key");

    fireEvent.drop(input, {
      dataTransfer: {
        files: {
          length: 0,
          item: () => null,
        },
      },
    });

    expect(setLLMConfigMock.mock.calls.length).toBe(initialCallCount);
  });

  it("ignores drag and drop for inputs that do not allow file drop", () => {
    const { props } = renderArea({
      llmConfig: makeConfig({
        selected: "llamaServer",
      }),
    });
    const setLLMConfigMock = getSetLLMConfigMock(props);
    const initialCallCount = setLLMConfigMock.mock.calls.length;

    const input = screen.getByLabelText("API Key");

    fireEvent.dragEnter(input);
    fireEvent.dragOver(input, {
      dataTransfer: {
        dropEffect: "none",
        files: {
          length: 0,
          item: () => null,
        },
      },
    });
    fireEvent.drop(input, {
      dataTransfer: {
        files: {
          length: 0,
          item: () => null,
        },
      },
    });

    expect(input).not.toHaveStyle({ cursor: "copy" });
    expect(setLLMConfigMock.mock.calls.length).toBe(initialCallCount);
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

  it("updates the selected Anthropic model from the slider", () => {
    const { props } = renderArea();

    const slider = screen.getByRole("slider", { name: "Model Selection" });
    act(() => {
      slider.focus();
      fireEvent.keyDown(slider, { key: "End" });
    });

    expect(props.setLLMConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        anthropic: expect.objectContaining({
          modelName: "claude-opus-4-6",
        }),
      }),
    );
  });

  it("updates the selected Bedrock model from the slider", async () => {
    const { props } = renderArea({
      llmConfig: makeConfig({
        selected: "bedrock",
      }),
    });

    const slider = screen.getByRole("slider", { name: "Model Selection" });
    act(() => {
      slider.focus();
      fireEvent.keyDown(slider, {
        key: "ArrowRight",
        code: "ArrowRight",
        keyCode: 39,
      });
    });

    await waitFor(() => {
      expect(props.setLLMConfig).toHaveBeenCalledWith(
        expect.objectContaining({
          bedrock: expect.objectContaining({
            modelName: "anthropic.claude-sonnet-4-6",
          }),
        }),
      );
    });
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

  it("shows the success indicator when a key is known to work", async () => {
    renderArea({
      llmConfig: makeConfig({
        anthropic: {
          ...defaultLLMConfig.anthropic,
          isKnownToWork: true,
        },
      }),
    });

    await waitFor(() => {
      expect(document.querySelector("svg")).toBeInTheDocument();
    });
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
