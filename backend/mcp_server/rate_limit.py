"""書き込み系ツールのレート制限。

なぜ nginx の limit_req ではなくアプリ側か:
    Claude からのリクエストはすべて Anthropic の egress レンジ
    （160.79.104.0/21）から来る。nginx は送信元 IP でしか制限できないため、
    そこで絞ると**全ユーザーが1つのバケツを共有**することになり、
    1人が叩くと全員が止まる。ユーザー単位で制限するには、
    トークンを解決した後（＝アプリ側）で判断するしかない。

プロセス内のメモリだけで完結させている。MCP サーバは1プロセスで動くため
共有ストアは不要（Redis を増やさない方針＝ ADR #9 を維持する）。
複数プロセスに増やす場合はここを共有ストアに置き換えること。
"""
import time
from collections import defaultdict, deque

from .constants import WRITE_RATE_LIMIT_COUNT, WRITE_RATE_LIMIT_WINDOW_SECONDS
from .errors import RateLimitError

# ユーザーID → 直近の書き込み時刻（古いものから捨てる）
_write_history = defaultdict(deque)


def check_write_rate_limit(user_id):
    """書き込みの頻度が上限を超えていたら RateLimitError を送出する。"""
    now = time.monotonic()
    history = _write_history[user_id]

    # ウィンドウから外れた履歴を捨てる
    while history and now - history[0] > WRITE_RATE_LIMIT_WINDOW_SECONDS:
        history.popleft()

    if len(history) >= WRITE_RATE_LIMIT_COUNT:
        raise RateLimitError(
            f'書き込みが多すぎます（{WRITE_RATE_LIMIT_WINDOW_SECONDS}秒あたり'
            f'{WRITE_RATE_LIMIT_COUNT}件まで）。少し時間をおいてからやり直してください。'
        )

    history.append(now)


def reset_rate_limit():
    """テスト用。プロセス内に溜まった履歴を消す。"""
    _write_history.clear()
