import { Card } from "@/components/ui/card";
import { useMenuBuilder } from "../hooks/useMenuBuilder";
import MenuBuilderPanel from "./MenuBuilderPanel";
import MenuPreviewPanel from "./MenuPreviewPanel";
import type { MealRecord } from "@/types";

interface MealFormProps {
  onMealCreated: (meal: MealRecord) => void;
}

/**
 * 「選ぶ」と「確認して記録する」を1枚のカードに収める（ADR #33）。
 * 記録は上から下へ一本道で、途中で別のカードへ視線を移させない。
 */
export default function MealForm({ onMealCreated }: MealFormProps) {
  const menuBuilder = useMenuBuilder(onMealCreated);

  return (
    <Card className="space-y-5 rounded-2xl p-5">
      <MenuBuilderPanel menuBuilder={menuBuilder} />
      <MenuPreviewPanel menuBuilder={menuBuilder} />
    </Card>
  );
}
