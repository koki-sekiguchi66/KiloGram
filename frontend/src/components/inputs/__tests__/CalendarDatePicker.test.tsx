import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarDatePicker } from "@/components/inputs/CalendarDatePicker";

describe("CalendarDatePicker コンポーネント", () => {
  it("トリガーに選択中の日付が表示される", () => {
    render(<CalendarDatePicker value="2026-09-08" onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "9/8" })).toBeInTheDocument();
  });

  it("トリガーをクリックするとカレンダーが開く", async () => {
    const user = userEvent.setup();
    render(<CalendarDatePicker value="2026-09-08" onChange={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "9/8" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("2026年9月")).toBeInTheDocument();
  });

  it("日付を選ぶと onChange が呼ばれ、カレンダーが閉じる", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<CalendarDatePicker value="2026-09-08" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "9/8" }));
    await user.click(screen.getByRole("button", { name: "15" }));

    expect(onChange).toHaveBeenCalledWith("2026-09-15");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("次の月ボタンで表示月が進む", async () => {
    const user = userEvent.setup();
    render(<CalendarDatePicker value="2026-09-08" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "9/8" }));
    await user.click(screen.getByRole("button", { name: "次の月" }));

    expect(screen.getByText("2026年10月")).toBeInTheDocument();
  });

  it("カレンダーの外側をクリックすると閉じる", async () => {
    const user = userEvent.setup();
    render(<CalendarDatePicker value="2026-09-08" onChange={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "9/8" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
