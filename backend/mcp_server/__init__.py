"""DishBoard の MCP サーバ。

DishBoard アプリケーションへの3番目の入口（Web / 外部スケジューラ に次ぐ）。
Django を直接 import し、既存の business_logic / serializers を呼ぶ。

このパッケージは Django アプリではない（モデルを持たない）。
ドメインロジックを書かず、MCP の入出力とドメイン層の橋渡しに徹する。
"""
