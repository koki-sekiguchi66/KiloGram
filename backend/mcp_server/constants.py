"""MCP 層の定数。

マジックナンバーを禁じる規約（CLAUDE.md）に従い、上限値はすべてここに集約する。
値の根拠をコメントに残すこと。
"""

# --- OAuth スコープ ---------------------------------------------------------
# settings.OAUTH2_PROVIDER['SCOPES'] のキーと一致していなければならない
SCOPE_MEALS_READ = 'meals:read'
SCOPE_MEALS_WRITE = 'meals:write'
SCOPE_WEIGHT_READ = 'weight:read'


# --- 入力の上限 -------------------------------------------------------------
# 期間指定の最大日数。1か月ぶんの推移を1回で取れれば分析には足りる
MAX_TREND_DAYS = 31

# 検索結果の最大件数。ツールの返り値はすべてコンテキストを消費するため絞る
MAX_SEARCH_RESULTS = 20

# あいまい検索が意味を持つ最小の文字数（既存の /api/foods/search/ と揃える）
MIN_SEARCH_QUERY_LENGTH = 2

# 1食あたりの明細の最大件数
MAX_ITEMS_PER_MEAL = 30

# 1明細の分量の上限(g)。10kg は現実的な食事の範囲を大きく超える
MAX_AMOUNT_GRAMS = 10000

# 一覧系ツールが返す最大件数
MAX_LIST_RECORDS = 100

# 文字列長。対応するモデルフィールドの max_length に合わせる
MAX_MEAL_NAME_LENGTH = 100      # MealRecord.meal_name
MAX_ITEM_NAME_LENGTH = 200      # MealRecordItem.item_name


# --- レート制限 -------------------------------------------------------------
# 書き込み系ツールのユーザー単位の制限。
# Claude は人間より遥かに速く叩けるため、誤解釈による大量登録を頭打ちにする。
# 20回/分は「対話しながら記録する」通常の使い方では到達しない水準
WRITE_RATE_LIMIT_COUNT = 20
WRITE_RATE_LIMIT_WINDOW_SECONDS = 60


# --- 栄養素 -----------------------------------------------------------------
# 分析系ツールが返す栄養素。PFC + kcal に絞ってコンテキストを節約する
SUMMARY_NUTRIENT_KEYS = (
    'calories',
    'protein',
    'fat',
    'carbohydrates',
)

# 詳細取得時に返す12栄養素。MealRecordItem のフィールド名と一致させる
DETAIL_NUTRIENT_KEYS = (
    'calories',
    'protein',
    'fat',
    'carbohydrates',
    'dietary_fiber',
    'sodium',
    'calcium',
    'iron',
    'vitamin_a',
    'vitamin_b1',
    'vitamin_b2',
    'vitamin_c',
)

# 栄養素の単位。ツールの description に載せて Claude に解釈させる
NUTRIENT_UNITS = {
    'calories': 'kcal',
    'protein': 'g',
    'fat': 'g',
    'carbohydrates': 'g',
    'dietary_fiber': 'g',
    'sodium': 'mg',
    'calcium': 'mg',
    'iron': 'mg',
    'vitamin_a': 'ug',
    'vitamin_b1': 'mg',
    'vitamin_b2': 'mg',
    'vitamin_c': 'mg',
}

# 丸めの桁数。栄養値の有効数字として小数2桁あれば足りる
NUTRIENT_ROUND_DIGITS = 2

# 明細の種別。MealRecordItem.ITEM_TYPE_CHOICES と一致させる
ITEM_TYPE_STANDARD = 'standard'
ITEM_TYPE_CUSTOM = 'custom'
ITEM_TYPE_CAFETERIA = 'cafeteria'
VALID_ITEM_TYPES = (ITEM_TYPE_STANDARD, ITEM_TYPE_CUSTOM, ITEM_TYPE_CAFETERIA)
