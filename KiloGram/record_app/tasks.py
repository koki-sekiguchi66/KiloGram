from celery import shared_task
from .business_logic.cafeteria_scraping import CafeteriaScraper

@shared_task
def update_cafeteria_menus_task():
    """食堂メニューを自動で更新"""
    try:
        scraper = CafeteriaScraper()
        count = scraper.fetch_and_update_menus()
        return f"メニューを更新しました。{count}件のメニューを取得しました。"
    except Exception as e:
        return f"メニューの更新に失敗しました: {str(e)}"