/**
 * AppearanceSettings — 表示設定コンポーネント
 */
import { Section } from "@/components/layout";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTheme } from "../hooks/useTheme";

export function AppearanceSettings() {
  const { theme, toggle } = useTheme();

  return (
    <Section title="表示設定">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="dark-mode-toggle" className="text-sm font-medium">
              ダークモード
            </Label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {theme === "dark"
                ? "ダークテーマが適用されています"
                : "ライトテーマが適用されています"}
            </p>
          </div>
          <Switch
            id="dark-mode-toggle"
            checked={theme === "dark"}
            onCheckedChange={toggle}
            aria-label="ダークモード切替"
          />
        </div>
      </div>
    </Section>
  );
}
