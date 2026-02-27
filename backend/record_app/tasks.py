"""
Celery非同期タスク
"""
from celery import shared_task
from pathlib import Path
import os
import logging

logger = logging.getLogger(__name__)


@shared_task
def update_cafeteria_menus_task():
    """
    食堂メニューを自動で更新
    
    定期実行により、食堂のウェブサイトから最新のメニュー情報を
    スクレイピングしてデータベースを更新。
    """
    try:
        from .business_logic.cafeteria_scraping import CafeteriaScraper
        scraper = CafeteriaScraper()
        count = scraper.fetch_and_update_menus()
        return f"メニューを更新しました。{count}件のメニューを取得しました。"
    except Exception as e:
        logger.exception("食堂メニュー更新エラー")
        return f"メニューの更新に失敗しました: {str(e)}"


@shared_task
def process_nutrition_label_task(image_path):
    """
    栄養成分表示のOCR処理を非同期実行
    
    重いOCR処理をCeleryワーカーに委託しAPIレスポンス時間を改善。
    Args:
        image_path: 処理する画像のパス
        
    Returns:
        dict: OCR処理結果
    """
    try:
        logger.info(f"Starting OCR processing for: {image_path}")
        
        # ファイル存在確認
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # OCR処理（意味ブロックアプローチ版）
        from .business_logic.ocr_processor import NutritionOCRProcessor
        processor = NutritionOCRProcessor(gpu=False)
        result = processor.process_nutrition_label(image_path)
        
        # 一時ファイルの削除
        try:
            os.remove(image_path)
            logger.info(f"Temporary file deleted: {image_path}")
        except Exception as e:
            logger.warning(f"Failed to delete temporary file: {str(e)}")
        
        logger.info(f"OCR processing completed: success={result['success']}")
        return result
        
    except Exception as e:
        logger.exception(f"OCR task error: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'nutrition': None
        }