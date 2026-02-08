// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

function InlineComponent() {
  return <div>Testing Library Ready</div>;
}

describe("testing library setup", () => {
  it("renders a simple component", () => {
    render(<InlineComponent />);
    expect(screen.getByText("Testing Library Ready")).toBeInTheDocument();
  });
});
