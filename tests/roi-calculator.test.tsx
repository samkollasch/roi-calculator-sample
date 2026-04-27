import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

import { ROICalculator } from "@/components/roi-calculator";

afterEach(() => cleanup());

describe("<ROICalculator />", () => {
  it("renders the input section and the live total", () => {
    render(<ROICalculator />);

    expect(
      screen.getByRole("heading", { name: /your team today/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/estimated total savings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/support agents on staff/i)).toHaveValue(25);
  });

  it("recalculates the total when the user changes a channel volume", async () => {
    const user = userEvent.setup();
    render(<ROICalculator />);

    const totalSavingsLabel = screen.getByLabelText(/^\$/);
    const initialSavings = totalSavingsLabel.textContent;

    const emailField = screen.getByLabelText(/monthly email conversations/i);
    await user.clear(emailField);
    await user.type(emailField, "10000");

    // The AnimatedMetric ticks between values via requestAnimationFrame, so
    // poll until it settles on a number larger than the initial savings.
    await vi.waitFor(() => {
      const current = totalSavingsLabel.textContent ?? "";
      const numeric = (text: string) => Number(text.replace(/[^0-9]/g, ""));
      expect(numeric(current)).toBeGreaterThan(numeric(initialSavings ?? ""));
    });
  });

  it("opens the confirmation dialog and fires onSubmit when confirmed", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<ROICalculator onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /see my full roi report/i }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/your custom plan is ready/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: /show my report/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      agents: 25,
      costPerContact: 15,
    });

    expect(
      await screen.findByRole("heading", { name: /estimated annual savings/i }),
    ).toBeInTheDocument();
  });

  it("returns to the form when the dashboard's adjust button is clicked", async () => {
    const user = userEvent.setup();
    render(<ROICalculator />);

    await user.click(screen.getByRole("button", { name: /see my full roi report/i }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /show my report/i }));

    await screen.findByRole("heading", { name: /estimated annual savings/i });
    await user.click(screen.getByRole("button", { name: /adjust inputs/i }));

    expect(
      screen.getByRole("heading", { name: /your team today/i }),
    ).toBeInTheDocument();
  });
});
