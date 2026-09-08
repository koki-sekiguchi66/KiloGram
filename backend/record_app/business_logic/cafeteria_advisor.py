"""残りの栄養目標に合う学食メニューを提案する。

学食のメニューは週次スクレイピングで持っている（ADR #5）。この資産と目標値
（ADR #28）を突き合わせられるのは DishBoard 固有の強みなので、
「今の残りに何を食べるとよいか」まで踏み込む。

HTTP を知らない純粋な処理として書く（backend/CLAUDE.md の層構造）。
"""
from ..models import CafeteriaMenu, NutritionGoal
from .nutrition_calculator import NutritionCalculatorService


# PFC は kcal に比べて桁が小さい。そのまま足すとカロリーだけで順位が決まるため、
# 各栄養素を「目標に対する割合」に正規化してから比較する
_SCORED_NUTRIENTS = ('calories', 'protein', 'fat', 'carbs')

# 摂り過ぎは摂り足りないより避けたいので、超過ぶんを重く見る
_OVERSHOOT_PENALTY = 1.5


class CafeteriaAdvisor:
    """残りの目標に近い学食メニューを並べる。"""

    def suggest(self, user, target_date, limit=5):
        goal = self._get_goal(user)
        consumed = NutritionCalculatorService().get_daily_nutrition_summary(user, target_date)
        remaining = self._remaining(goal, consumed)

        scored = [
            (self._score(menu, remaining, goal), menu)
            for menu in CafeteriaMenu.objects.all()
        ]
        scored.sort(key=lambda pair: pair[0])

        return {
            'date': str(target_date),
            'goal': goal,
            'consumed': {key: consumed[self._consumed_key(key)] for key in _SCORED_NUTRIENTS},
            'remaining': remaining,
            'suggestions': [
                self._to_suggestion(menu, remaining) for _, menu in scored[:limit]
            ],
        }

    def _get_goal(self, user):
        """未設定でもモデルの既定値を使う（既定値の定義はモデルに一本化。ADR #28）。"""
        goal = NutritionGoal.objects.filter(user=user).first() or NutritionGoal()
        return {
            'calories': goal.calories,
            'protein': goal.protein,
            'fat': goal.fat,
            'carbs': goal.carbs,
        }

    @staticmethod
    def _consumed_key(key):
        # 日次サマリーは炭水化物を carbohydrates で持つ
        return 'carbohydrates' if key == 'carbs' else key

    def _remaining(self, goal, consumed):
        return {
            key: round(goal[key] - consumed[self._consumed_key(key)], 1)
            for key in _SCORED_NUTRIENTS
        }

    @staticmethod
    def _menu_nutrition(menu):
        return {
            'calories': menu.calories,
            'protein': menu.protein,
            'fat': menu.fat,
            'carbs': menu.carbohydrates,
        }

    def _score(self, menu, remaining, goal):
        """小さいほど「残りにちょうど良い」。目標比で正規化した差の合計。"""
        nutrition = self._menu_nutrition(menu)
        total = 0.0

        for key in _SCORED_NUTRIENTS:
            # 目標が 0 のときは比較できないので、その栄養素は採点しない
            scale = goal[key] or 1
            diff = (nutrition[key] - remaining[key]) / scale
            total += diff * _OVERSHOOT_PENALTY if diff > 0 else -diff

        return total

    def _to_suggestion(self, menu, remaining):
        nutrition = self._menu_nutrition(menu)
        return {
            'menu_id': menu.menu_id,
            'name': menu.name,
            'category': menu.category,
            'nutrition': nutrition,
            'remaining_after': {
                key: round(remaining[key] - nutrition[key], 1)
                for key in _SCORED_NUTRIENTS
            },
        }
