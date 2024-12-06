import { render } from "@testing-library/react";
import { screen } from "@testing-library/dom";
import '@testing-library/jest-dom';

import "@anthropic-ai/sdk/shims/node";

import App from "./App";

describe("App Component", () => {
  it("renders the app correctly", () => {
    render(<App />);
    expect(
        screen.getByText("LLM Configuration", { exact: false })
    ).toBeInTheDocument();
  });
});
