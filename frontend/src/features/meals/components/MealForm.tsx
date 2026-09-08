import { type ReactNode } from "react";
import { useMenuBuilder } from "../hooks/useMenuBuilder";
import MenuBuilderPanel from "./MenuBuilderPanel";
import MenuPreviewPanel from "./MenuPreviewPanel";
import type { MealRecord } from "@/types";

interface MealFormProps {
  onMealCreated: (meal: MealRecord) => void;
  /** 見出しの右に置く操作（ページ遷移リンクなど） */
  headerAction?: ReactNode;
}

/**
 * 「選ぶ」と「確認して記録する」を1つの流れに並べる（ADR #33）。
 * 枠は持たず、罫線と余白だけで区切る（ADR #34）。
 */
export default function MealForm({ onMealCreated, headerAction }: MealFormProps) {
  const menuBuilder = useMenuBuilder(onMealCreated);

  return (
    <div className="space-y-6">
      <MenuBuilderPanel menuBuilder={menuBuilder} headerAction={headerAction} />
      <MenuPreviewPanel menuBuilder={menuBuilder} />
    </div>
  );
}
