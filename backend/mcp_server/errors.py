"""MCP ツールのエラー表現。

方針（設計書 §5「エラーハンドリング」）:
  - 利用者（Claude）には**修正方法がわかるメッセージ**を返す
  - 内部エラーの詳細はログにだけ残し、スタックトレースや内部パスを返さない
  - 他ユーザーのリソースを指定された場合は 404 相当。403 だと存在が漏れる
"""


class MCPToolError(Exception):
    """ツールの実行を中断し、Claude に説明可能なメッセージを返す。

    MCP SDK は例外を捕捉してツール結果を isError として返すため、
    この例外のメッセージがそのまま Claude に渡る。
    **利用者に見せてよい内容だけを入れること。**
    """


class InsufficientScopeError(MCPToolError):
    """トークンに必要なスコープが無い。

    HTTP でいう 403 / insufficient_scope に相当する。
    再認可が必要であることを伝える。
    """


class NotFoundError(MCPToolError):
    """指定されたリソースが存在しない、または自分のものではない。

    他ユーザーのリソースを指定された場合もこれを使う。
    「権限がない」と返すと、そのIDのリソースが存在すること自体が漏れるため。
    """


class ValidationError(MCPToolError):
    """入力が不正。何をどう直せばよいかをメッセージに含める。"""


class RateLimitError(MCPToolError):
    """書き込みの頻度が上限を超えた。"""
