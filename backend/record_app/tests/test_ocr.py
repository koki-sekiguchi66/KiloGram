import numpy as np
from unittest.mock import patch, MagicMock, PropertyMock
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.core.files.uploadedfile import SimpleUploadedFile

from record_app.business_logic.ocr_processor import (
    AdaptiveImagePreprocessor,
    NutritionOCRProcessor,
    OCRPostProcessor,
    NutritionExtractor,
    NutritionValidator,
    SemanticBlock,
    TextBox,
)


# =============================================================================
# 画像前処理テスト
# =============================================================================

class ImagePreprocessingTests(TestCase):
    """AdaptiveImagePreprocessorの単体テスト"""
    
    def test_detect_inverted_colors_dark_image(self):
        """暗い画像の色反転検出"""
        # 暗い画像（平均輝度 < 100）
        dark_image = np.zeros((100, 100, 3), dtype=np.uint8) + 50
        result = AdaptiveImagePreprocessor.detect_inverted_colors(dark_image)
        self.assertTrue(result)
        
    def test_detect_inverted_colors_bright_image(self):
        """明るい画像は色反転なし"""
        bright_image = np.ones((100, 100, 3), dtype=np.uint8) * 200
        result = AdaptiveImagePreprocessor.detect_inverted_colors(bright_image)
        self.assertFalse(result)
    
    def test_detect_red_background_red_image(self):
        """赤背景の検出"""
        red_image = np.zeros((100, 100, 3), dtype=np.uint8)
        red_image[:, :, 2] = 255  # Red channel
        result = AdaptiveImagePreprocessor.detect_red_background(red_image)
        self.assertTrue(result)
        
    def test_detect_red_background_white_image(self):
        """白背景は赤背景ではない"""
        white_image = np.ones((100, 100, 3), dtype=np.uint8) * 255
        result = AdaptiveImagePreprocessor.detect_red_background(white_image)
        self.assertFalse(result)

    def test_detect_red_background_grayscale(self):
        """グレースケール画像は赤背景ではない"""
        gray_image = np.ones((100, 100), dtype=np.uint8) * 128
        result = AdaptiveImagePreprocessor.detect_red_background(gray_image)
        self.assertFalse(result)

    def test_sharpen_image(self):
        """シャープ化フィルタの適用"""
        image = np.ones((100, 100, 3), dtype=np.uint8) * 128
        result = AdaptiveImagePreprocessor.sharpen_image(image)
        self.assertEqual(result.shape, image.shape)
        
    @patch('record_app.business_logic.ocr_processor.cv2')
    def test_grayscale_conversion(self, mock_cv2):
        """前処理パイプラインのグレースケール変換
        """
        test_image = np.ones((100, 100, 3), dtype=np.uint8) * 200
        mock_cv2.imread.return_value = test_image
        mock_cv2.cvtColor.return_value = np.ones((100, 100), dtype=np.uint8) * 200
        mock_cv2.IMREAD_COLOR = 1
        mock_cv2.COLOR_BGR2GRAY = 6
        mock_cv2.COLOR_BGR2HSV = 40

        mock_cv2.inRange.return_value = np.zeros((100, 100), dtype=np.uint8)
        
        mock_cv2.Canny.return_value = np.zeros((100, 100), dtype=np.uint8)
        mock_cv2.HoughLinesP.return_value = None
        mock_cv2.createCLAHE.return_value = MagicMock(
            apply=MagicMock(return_value=np.ones((100, 100), dtype=np.uint8) * 200)
        )
        mock_cv2.filter2D.return_value = test_image
        mock_cv2.addWeighted.return_value = test_image
        mock_cv2.bilateralFilter.return_value = np.ones((100, 100), dtype=np.uint8) * 200
        mock_cv2.adaptiveThreshold.return_value = np.ones((100, 100), dtype=np.uint8) * 200
        
        preprocessor = AdaptiveImagePreprocessor()
        result = preprocessor.preprocess('/tmp/test.jpg')
        
        mock_cv2.imread.assert_called_once()


# =============================================================================
# OCR後処理テスト
# =============================================================================

class OCRPostProcessorTests(TestCase):
    """OCR誤認識補正のテスト"""
    
    def test_correct_nutrient_names(self):
        """栄養素名の誤認識補正"""
        processor = OCRPostProcessor()
        
        self.assertIn('たんぱく質', processor.correct_text('たんぱく貿'))
        self.assertIn('脂質', processor.correct_text('脂貿'))
        self.assertIn('炭水化物', processor.correct_text('炭水イヒ物'))
        self.assertIn('エネルギー', processor.correct_text('工ネルギー'))
        
    def test_correct_unit_errors(self):
        """単位の誤認識補正"""
        processor = OCRPostProcessor()
        
        self.assertIn('g', processor.correct_text('10』'))
        self.assertIn('kcal', processor.correct_text('100kca1'))
        
    def test_extract_numeric_value(self):
        """数値抽出"""
        self.assertEqual(OCRPostProcessor.extract_numeric_value('49kcal'), 49.0)
        self.assertEqual(OCRPostProcessor.extract_numeric_value('3.3g'), 3.3)
        self.assertEqual(OCRPostProcessor.extract_numeric_value('100'), 100.0)
        
    def test_extract_numeric_value_none_for_no_number(self):
        """数値がない場合はNone"""
        self.assertIsNone(OCRPostProcessor.extract_numeric_value('テスト'))


# =============================================================================
# 栄養素抽出テスト
# =============================================================================

class NutritionExtractorTests(TestCase):
    """NutritionExtractorの単体テスト"""
    
    def test_extract_from_blocks_basic(self):
        """基本的な栄養素ブロックからの抽出"""
        extractor = NutritionExtractor()
        
        blocks = [
            SemanticBlock(text_boxes=[
                TextBox(text='エネルギー', bbox=[[0,0],[100,0],[100,20],[0,20]], confidence=0.9),
                TextBox(text='250kcal', bbox=[[110,0],[200,0],[200,20],[0,20]], confidence=0.9),
            ]),
            SemanticBlock(text_boxes=[
                TextBox(text='たんぱく質', bbox=[[0,30],[100,30],[100,50],[0,50]], confidence=0.9),
                TextBox(text='15.5g', bbox=[[110,30],[200,30],[200,50],[0,50]], confidence=0.9),
            ]),
        ]
        
        result = extractor.extract_from_blocks(blocks)
        self.assertEqual(result['calories'], 250.0)
        self.assertEqual(result['protein'], 15.5)
    
    def test_extract_inline_format(self):
        """インライン形式（読点区切り）からの抽出"""
        extractor = NutritionExtractor()
        
        blocks = [
            SemanticBlock(text_boxes=[
                TextBox(
                    text='熱量16kcal、たんぱく質1.6g、脂質0g',
                    bbox=[[0,0],[400,0],[400,20],[0,20]],
                    confidence=0.9
                ),
            ]),
        ]
        
        result = extractor.extract_from_blocks(blocks)
        self.assertEqual(result['calories'], 16.0)
        self.assertEqual(result['protein'], 1.6)
        self.assertEqual(result['fat'], 0.0)


# =============================================================================
# 整合性検証テスト
# =============================================================================

class NutritionValidatorTests(TestCase):
    """NutritionValidatorの単体テスト"""
    
    def test_valid_nutrition(self):
        """整合性のある栄養素データ"""
        nutrition = {
            'calories': 200,
            'protein': 10,
            'fat': 8,
            'carbohydrates': 20,
        }
        result = NutritionValidator.validate(nutrition)
        self.assertTrue(result['is_valid'])
        
    def test_energy_mismatch(self):
        """エネルギー計算式との乖離検出"""
        nutrition = {
            'calories': 1000,  # 計算値と大きく乖離
            'protein': 10,     # 40kcal
            'fat': 5,          # 45kcal
            'carbohydrates': 20,  # 80kcal
           
        }
        result = NutritionValidator.validate(nutrition)
        self.assertFalse(result['is_valid'])
        
        warning_types = [w['type'] for w in result['warnings']]
        self.assertIn('energy_mismatch', warning_types)

    def test_none_values_no_crash(self):
        """None値でもクラッシュしない"""
        nutrition = {
            'calories': None,
            'protein': None,
            'fat': None,
            'carbohydrates': None,
        }
        result = NutritionValidator.validate(nutrition)
        self.assertTrue(result['is_valid'])


# =============================================================================
# NutritionOCRProcessor テスト
# =============================================================================

class NutritionLabelOCRTests(TestCase):
    """NutritionOCRProcessorの単体テスト"""
    
    def test_ocr_initialization(self):
        """OCRプロセッサの初期化（遅延ロード確認）"""
        processor = NutritionOCRProcessor(gpu=False)
        self.assertIsNone(processor._reader)
        self.assertFalse(processor._gpu)
        
    def test_parse_nutrition_values(self):
        """栄養素パース（OCRPostProcessorの統合テスト）"""
        processor = OCRPostProcessor()
        
        self.assertEqual(processor.extract_numeric_value('100kcal'), 100.0)
        self.assertEqual(processor.extract_numeric_value('3.5g'), 3.5)
        self.assertEqual(processor.extract_numeric_value('0.8mg'), 0.8)
        
    @patch.object(NutritionOCRProcessor, 'reader', new_callable=PropertyMock)
    @patch('record_app.business_logic.ocr_processor.AdaptiveImagePreprocessor')
    def test_extract_nutrition_from_image(self, mock_preprocessor_cls, mock_reader):
        """画像からの栄養素抽出（モック版）"""
        mock_preprocessor = MagicMock()
        mock_preprocessor.preprocess.return_value = np.ones((100, 100, 3), dtype=np.uint8)
        mock_preprocessor_cls.return_value = mock_preprocessor
        
        mock_reader_instance = MagicMock()
        mock_reader_instance.readtext.return_value = [
            ([[0,0],[200,0],[200,30],[0,30]], 'エネルギー 250kcal', 0.95),
            ([[0,40],[200,40],[200,70],[0,70]], 'たんぱく質 15g', 0.90),
            ([[0,80],[200,80],[200,110],[0,110]], '脂質 8g', 0.88),
            ([[0,120],[200,120],[200,150],[0,150]], '炭水化物 30g', 0.92),
        ]
        mock_reader.return_value = mock_reader_instance
        
        processor = NutritionOCRProcessor(gpu=False)
        result = processor.process_nutrition_label('/tmp/test.jpg')
        
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['nutrition'])

    @patch.object(NutritionOCRProcessor, 'reader', new_callable=PropertyMock)
    @patch('record_app.business_logic.ocr_processor.AdaptiveImagePreprocessor')
    def test_handle_invalid_image(self, mock_preprocessor_cls, mock_reader):
        """無効な画像のハンドリング"""
        mock_preprocessor = MagicMock()
        mock_preprocessor.preprocess.side_effect = Exception("画像読み込みエラー")
        mock_preprocessor_cls.return_value = mock_preprocessor
        
        processor = NutritionOCRProcessor(gpu=False)
        result = processor.process_nutrition_label('/tmp/invalid.jpg')
        
        self.assertFalse(result['success'])
        self.assertIn('error', result)


# =============================================================================
# OCR APIテスト
# =============================================================================

class OCRAPITests(APITestCase):
    """OCR APIエンドポイントのテスト"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass123')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
        self.ocr_url = '/api/ocr/nutrition-label/'
        
    def test_upload_without_image_fails(self):
        """画像なしのリクエストは400エラー"""
        response = self.client.post(self.ocr_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
    @patch('record_app.business_logic.ocr_processor.NutritionOCRProcessor')
    def test_upload_nutrition_label(self, mock_processor_cls):
        """栄養成分ラベルのアップロード"""
        mock_processor = MagicMock()
        mock_processor.process_nutrition_label.return_value = {
            'success': True,
            'nutrition': {
                'calories': 250.0,
                'protein': 15.0,
                'fat': 8.0,
                'carbohydrates': 30.0,
            },
            'validation': {'is_valid': True, 'warnings': []},
            'detected_texts': ['エネルギー', '250kcal'],
        }
        mock_processor_cls.return_value = mock_processor
        
        image_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        image = SimpleUploadedFile(
            'test.png', image_content, content_type='image/png'
        )
        
        response = self.client.post(self.ocr_url, {'image': image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

    def test_upload_oversized_image_fails(self):
        """10MBを超える画像は400エラー"""
        large_content = b'\x89PNG\r\n\x1a\n' + b'\x00' * (11 * 1024 * 1024)
        image = SimpleUploadedFile(
            'large.png', large_content, content_type='image/png'
        )
        
        response = self.client.post(self.ocr_url, {'image': image}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_invalid_file_type_fails(self):
        """非画像ファイルは400エラー"""
        text_file = SimpleUploadedFile(
            'test.txt', b'not an image', content_type='text/plain'
        )
        
        response = self.client.post(self.ocr_url, {'image': text_file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


# =============================================================================
# OCR統合テスト
# =============================================================================

class TestOCRIntegration(TestCase):
    """OCRパイプラインの統合テスト"""
    
    @patch.object(NutritionOCRProcessor, 'reader', new_callable=PropertyMock)
    @patch('record_app.business_logic.ocr_processor.AdaptiveImagePreprocessor')
    def test_full_ocr_pipeline(self, mock_preprocessor_cls, mock_reader):
        """OCR処理パイプライン全体のテスト"""
        mock_preprocessor = MagicMock()
        test_image = np.ones((200, 300, 3), dtype=np.uint8) * 200
        mock_preprocessor.preprocess.return_value = test_image
        mock_preprocessor_cls.return_value = mock_preprocessor
        
        mock_reader_instance = MagicMock()
        mock_reader_instance.readtext.return_value = [
            ([[10,10],[200,10],[200,40],[10,40]], 'エネルギー 350kcal', 0.95),
            ([[10,50],[200,50],[200,80],[10,80]], 'たんぱく質 20g', 0.90),
            ([[10,90],[200,90],[200,120],[10,120]], '脂質 12g', 0.88),
            ([[10,130],[200,130],[200,160],[10,160]], '炭水化物 40g', 0.92),
        ]
        mock_reader.return_value = mock_reader_instance
        
        processor = NutritionOCRProcessor(gpu=False)
        result = processor.process_nutrition_label('/tmp/test_label.jpg')
        
        self.assertTrue(result['success'])
        nutrition = result['nutrition']
        self.assertEqual(nutrition['calories'], 350.0)
        self.assertEqual(nutrition['protein'], 20.0)
        self.assertEqual(nutrition['fat'], 12.0)
        self.assertEqual(nutrition['carbohydrates'], 40.0)
        
    @patch.object(NutritionOCRProcessor, 'reader', new_callable=PropertyMock)
    @patch('record_app.business_logic.ocr_processor.AdaptiveImagePreprocessor')
    def test_ocr_with_empty_result(self, mock_preprocessor_cls, mock_reader):
        """OCRがテキストを検出できない場合"""
        mock_preprocessor = MagicMock()
        test_image = np.ones((100, 100, 3), dtype=np.uint8) * 200
        mock_preprocessor.preprocess.return_value = test_image
        mock_preprocessor_cls.return_value = mock_preprocessor
        
        mock_reader_instance = MagicMock()
        mock_reader_instance.readtext.return_value = []
        mock_reader.return_value = mock_reader_instance
        
        processor = NutritionOCRProcessor(gpu=False)
        result = processor.process_nutrition_label('/tmp/blank.jpg')
        
        self.assertFalse(result['success'])
        
    @patch.object(NutritionOCRProcessor, 'reader', new_callable=PropertyMock)
    @patch('record_app.business_logic.ocr_processor.AdaptiveImagePreprocessor')
    def test_ocr_with_low_confidence(self, mock_preprocessor_cls, mock_reader):
        """低信頼度のOCR結果"""
        mock_preprocessor = MagicMock()
        test_image = np.ones((100, 100, 3), dtype=np.uint8) * 200
        mock_preprocessor.preprocess.return_value = test_image
        mock_preprocessor_cls.return_value = mock_preprocessor
        
        mock_reader_instance = MagicMock()
        mock_reader_instance.readtext.return_value = [
            ([[0,0],[100,0],[100,20],[0,20]], 'abc', 0.05), 
        ]
        mock_reader.return_value = mock_reader_instance
        
        processor = NutritionOCRProcessor(gpu=False)
        result = processor.process_nutrition_label('/tmp/blurry.jpg')
        
        self.assertFalse(result['success'])