import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { ClipboardList, ArrowRight } from "lucide-react";
import { ScaleGaugeIcon } from "@/components/icons";

import { MealForm, EditMealModal, mealApi, useQuickRepeat } from "@/features/meals";
import { WeightForm } from "@/features/weights";
import { SaveAsMenuModal } from "@/features/customMenus";
import { InstallPWA } from "@/components/PWA";
import { useDashboardData } from "../hooks/useDashboardData";
import { AppShell, type PageId } from "@/components/layout";
import { RecordTab } from "@/features/record";
import type { Meal } from "@/features/record";
import { AnalysisPage } from "@/features/analysis";
import { SettingsPage, useGoalSettings } from "@/features/settings";
import type { MealRecord } from "@/types";

interface DashboardProps {
  handleLogout: () => void;
}

const Dashboard = ({ handleLogout }: DashboardProps) => {
  const [editingMeal, setEditingMeal] = useState<MealRecord | null>(null);
  const [savingMenuMeal, setSavingMenuMeal] = useState<Meal | null>(null);

  // toISOString() は UTC 変換で JST の日付がずれるためローカル時刻で組み立てる
  const initialDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const { data, actions } = useDashboardData(initialDate);
  const { meals, allMeals, weights, dailySummary, selectedDate, message } = data;

  const { goals } = useGoalSettings();
  const { repeatMeal, isRepeating } = useQuickRepeat();

  // data.message はデータ取得・削除失敗時に立つが、UI側で表示先を持っていなかったため
  // ユーザーには何も伝わらず失敗が握りつぶされていた。sonner のトーストで拾う
  useEffect(() => {
    if (message) toast.error(message);
  }, [message]);

  const onMealUpdateWrapper = (updatedMeal: MealRecord) => {
    actions.handleMealUpdated(updatedMeal);
    setEditingMeal(null);
  };

  const confirmDelete = (mealId: number) => {
    if (window.confirm("この記録を本当に削除しますか？")) {
      actions.handleMealDelete(mealId);
    }
  };

  // 一覧の meal は MealRecordListSerializer 由来で基本4栄養素しか持たないため、
  // そのまま編集モーダルへ渡すと詳細栄養素（食物繊維・ナトリウム等）が
  // 0として表示され、更新時に実際の値を消してしまう。編集前に詳細を取得し直す
  const handleMealEdit = async (meal: Meal) => {
    try {
      const detail = await mealApi.getMealDetail(meal.id);
      setEditingMeal(detail);
    } catch (error) {
      console.error("Failed to fetch meal detail", error);
      toast.error("食事記録の詳細取得に失敗しました。");
    }
  };

  const handleMealRepeat = async (pastMeal: MealRecord) => {
    const created = await repeatMeal(pastMeal, selectedDate);
    if (created) actions.handleMealCreated(created);
  };

  const weightFormSlot = useMemo(
    () => (
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/40 text-foreground">
            <ScaleGaugeIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-lg">体重</h2>
            <p className="truncate text-xs text-muted-foreground">
              今日の体重を記録して、からだの変化を見てみましょう。
            </p>
          </div>
        </div>
        <WeightForm onWeightCreated={actions.handleWeightCreated} />
      </div>
    ),
    [actions.handleWeightCreated]
  );

  const renderRecordContent = (navigate: (page: PageId) => void) => (
    <RecordTab
      selectedDate={selectedDate}
      onDateChange={actions.handleDateChange}
      meals={meals}
      allMeals={allMeals}
      dailySummary={dailySummary}
      goals={goals}
      onMealEdit={handleMealEdit}
      onMealDelete={confirmDelete}
      onMealSaveAsMenu={setSavingMenuMeal}
      onMealRepeat={handleMealRepeat}
      isRepeatingMeal={isRepeating}
      mealFormSlot={
        <MealForm
          onMealCreated={actions.handleMealCreated}
          headerAction={
            <button
              type="button"
              onClick={() => navigate("analysis")}
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ClipboardList className="h-4 w-4" />
              今日の食事を振り返る
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
        />
      }
      weightFormSlot={weightFormSlot}
    />
  );

  const analysisContent = (
    <AnalysisPage
      allMeals={allMeals}
      weights={weights}
      dailySummary={
        dailySummary
          ? {
              calories: dailySummary.calories,
              protein: dailySummary.protein,
              fat: dailySummary.fat,
              carbohydrates: dailySummary.carbohydrates,
            }
          : null
      }
    />
  );

  const settingsContent = <SettingsPage />;

  return (
    <>
      <InstallPWA />
      <AppShell
        onLogout={handleLogout}
        renderRecordContent={renderRecordContent}
        analysisContent={analysisContent}
        settingsContent={settingsContent}
      />

      {editingMeal && (
        <EditMealModal
          meal={editingMeal}
          show={!!editingMeal}
          onClose={() => setEditingMeal(null)}
          onMealUpdated={onMealUpdateWrapper}
        />
      )}

      <SaveAsMenuModal
        show={!!savingMenuMeal}
        mealId={savingMenuMeal?.id ?? null}
        defaultName={savingMenuMeal?.meal_name}
        onClose={() => setSavingMenuMeal(null)}
      />
    </>
  );
};

export default Dashboard;
