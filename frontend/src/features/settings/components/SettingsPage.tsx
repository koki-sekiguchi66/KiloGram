/**
 * SettingsPage — 設定ページコンテナ
 *
 * サイドバーの「設定」から遷移するページ。
 * 上から順に: ProfileSection → GoalSettings → AppearanceSettings の3セクション構成。
 *
 * アーキテクチャ:
 *   AppShell.tsx の settingsContent prop に渡される。
 *   各セクションは独立しており、状態を共有しない（疎結合）。
 *
 * 設計判断:
 *   - 純粋なプレゼンテーション層。データ取得や状態管理は各セクションに委譲
 *   - 上下マージンは AnalysisPage と統一（space-y-5 pb-8）
 *   - 将来的にセクションを並び替え可能にする余地を残す
 */
import { ProfileSection } from "./ProfileSection";
import { GoalSettings } from "./GoalSettings";
import { AppearanceSettings } from "./AppearanceSettings";

export function SettingsPage() {
  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-col gap-8"
      data-testid="settings-page"
    >
      <header>
        <span className="block h-px w-10 bg-primary" aria-hidden="true" />
        <h2 className="font-display mt-5 text-4xl">設定</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          目標値と見た目を、自分の暮らしに合わせて整えます。
        </p>
      </header>

      <ProfileSection />
      <GoalSettings />
      <AppearanceSettings />
    </div>
  );
}
