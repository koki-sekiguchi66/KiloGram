"""
栄養成分表示OCRプロセッサ

処理概要:
1. EasyOCRによる位置情報付きテキスト検出
2. 空間的クラスタリングによる意味ブロック形成
3. 左上→右下の走査順序による自然な読み取り
4. 適応的前処理（色反転検出、傾き補正、シャープ化）
5. OCR誤認識パターンの後処理補正（強化版）
6. 栄養素間整合性検証

アーキテクチャ:
入力画像 → 適応的前処理 → EasyOCR（位置情報付き）→ 意味ブロック形成
→ 栄養素ペア抽出 → 後処理補正 → 整合性検証 → 構造化データ出力
"""

import re
import cv2
import numpy as np
from PIL import Image
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Tuple, Optional, Any
from sklearn.cluster import DBSCAN
import logging

logger = logging.getLogger(__name__)


# =============================================================================
# データクラス定義
# =============================================================================

@dataclass
class TextBox:
    """
    OCRで検出されたテキストボックス
    
    EasyOCRの検出結果を構造化し、後続処理で扱いやすくする。
    center_x, center_yはクラスタリング時の距離計算に使用。
    """
    text: str
    bbox: List[List[int]]  # [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
    confidence: float
    center_x: float = field(init=False)
    center_y: float = field(init=False)
    width: float = field(init=False)
    height: float = field(init=False)
    
    def __post_init__(self):
        """バウンディングボックスから中心座標とサイズを計算"""
        xs = [point[0] for point in self.bbox]
        ys = [point[1] for point in self.bbox]
        self.center_x = sum(xs) / 4
        self.center_y = sum(ys) / 4
        self.width = max(xs) - min(xs)
        self.height = max(ys) - min(ys)


@dataclass
class SemanticBlock:
    """
    意味ブロック：空間的に近接するテキストボックスのグループ
    
    「エネルギー 49kcal」のように、栄養素名と値が近接して配置されている
    テキスト群を一つのブロックとして扱います。これにより、行やテーブル構造に
    依存せず、栄養素情報を抽出できます。
    """
    text_boxes: List[TextBox]
    combined_text: str = field(init=False)
    top_left_x: float = field(init=False)
    top_left_y: float = field(init=False)
    
    def __post_init__(self):
        """ブロック内のテキストを結合し、左上座標を計算"""
        # 左から右、上から下の順でテキストをソート
        sorted_boxes = sorted(
            self.text_boxes,
            key=lambda b: (b.center_y // 20, b.center_x)  # 行方向を優先
        )
        self.combined_text = ' '.join(box.text for box in sorted_boxes)
        
        # ブロック全体の左上座標（走査順序に使用）
        self.top_left_x = min(box.bbox[0][0] for box in self.text_boxes)
        self.top_left_y = min(box.bbox[0][1] for box in self.text_boxes)


# =============================================================================
# OCR誤認識補正クラス（第4段階）- 強化版
# =============================================================================

class OCRPostProcessor:
    """
    OCR誤認識パターンの補正
    
    EasyOCRで頻出する誤認識パターンを文脈に応じて補正。
    特に日本語の栄養成分表示でよく見られるパターンに対応。
    
    追加パターン:
    - 』→g（カタカナや記号への誤認識）
    - ブ→g
    - 呂→g
    - 小数点の消失パターン
    """
    
    # 数値コンテキストでの文字→数字変換
    # OCRでよく発生する誤認識パターン
    NUMERIC_CORRECTIONS = {
        'O': '0', 'o': '0', 'Q': '0', 'D': '0',
        'l': '1', 'I': '1', '|': '1', 'i': '1',
        'S': '5', 's': '5',
        'B': '8',
        'g': '9', 'q': '9',
        'Z': '2', 'z': '2',
        '。': '.',  # 日本語句点→小数点
        '、': '.',  # 読点→小数点（場合により）
        '．': '.',  # 全角ピリオド
        '，': ',',  # 全角カンマ
    }
    
    # 単位の誤認識補正（gの誤認識パターンを大幅強化）
    UNIT_CORRECTIONS = {
        # gの誤認識パターン
        '』': 'g',
        '』g': 'g',
        'ブ': 'g',
        '呂': 'g',
        '９': 'g',
        'ダ': 'g',
        'グ': 'g',
        'ク': 'g',
        'り': 'g',
        '𝗀': 'g',
        'ɡ': 'g',
        'ｇ': 'g',
        # kcalの誤認識パターン
        'kcaI': 'kcal',
        'kca1': 'kcal',
        'КcaI': 'kcal',
        'kcaL': 'kcal',
        'Kcal': 'kcal',
        'KCal': 'kcal',
        'KCAL': 'kcal',
        'КcaL': 'kcal',
        'kcaｌ': 'kcal',
        # mgの誤認識パターン
        'mg': 'mg',
        'Mg': 'mg',
        'MG': 'mg',
        'm9': 'mg',
        'mq': 'mg',
        'ｍｇ': 'mg',
        # μgの誤認識パターン
        'μg': 'μg',
        'ug': 'μg',
        'mcg': 'μg',
        'ΜG': 'μg',
        'µg': 'μg',
    }
    
    # 栄養素名の誤認識補正
    NUTRIENT_NAME_CORRECTIONS = {
        # たんぱく質
        'たんぱく貿': 'たんぱく質',
        'タンパク貿': 'タンパク質',
        '蛋白貿': '蛋白質',
        'たん白質': 'たんぱく質',
        'たん自質': 'たんぱく質',
        'たんぱく買': 'たんぱく質',
        'タンパク買': 'タンパク質',
        'たんはく質': 'たんぱく質',
        # 脂質
        '脂貿': '脂質',
        '脂買': '脂質',
        '脂賀': '脂質',
        # 糖質
        '糖貿': '糖質',
        '糖買': '糖質',
        # 炭水化物
        '炭水イヒ物': '炭水化物',
        '炭水化勿': '炭水化物',
        '炭水イ匕物': '炭水化物',
        '炭水仁物': '炭水化物',
        '炭水亿物': '炭水化物',
        # 食物繊維
        '食物線維': '食物繊維',
        '食物繊椎': '食物繊維',
        '食物せんい': '食物繊維',
        '食物線椎': '食物繊維',
        # エネルギー・熱量
        '工ネルギー': 'エネルギー',
        'エネルギ一': 'エネルギー',
        'カロリ一': 'カロリー',
        '熟量': '熱量',
        '然量': '熱量',
        '勲量': '熱量',
        '熱星': '熱量',
        # ミネラル
        'ナトリウ厶': 'ナトリウム',
        'カルシウ厶': 'カルシウム',
        'マグネシウ厶': 'マグネシウム',
        # 食塩相当量
        '食塩相当量': '食塩相当量',
        '食塩相当星': '食塩相当量',
        '食鹽相当量': '食塩相当量',
        '良眞相当一': '食塩相当量',
        '良塩相当量': '食塩相当量',
        '食温相当量': '食塩相当量',
    }
    
    # 数値+単位の誤認識パターン（正規表現で処理）
    # 例: "18』" → "1.8g", "53』" → "5.3g"
    NUMERIC_UNIT_PATTERNS = [
        # 2桁数字+誤認識単位 → 小数点を挿入してgに変換
        (r'(\d)(\d)[』ブ呂ダグクり]$', r'\1.\2g'),
        (r'(\d)(\d)[』ブ呂ダグクり]([^a-zA-Z])', r'\1.\2g\3'),
        # 3桁数字+誤認識単位
        (r'(\d)(\d)(\d)[』ブ呂ダグクり]$', r'\1\2.\3g'),
        # 数字+誤認識単位
        (r'(\d+)[』ブ呂ダグクり]$', r'\1g'),
        (r'(\d+)[』ブ呂ダグクり]([^a-zA-Z])', r'\1g\2'),
    ]
    
    @classmethod
    def correct_text(cls, text: str) -> str:
        """
        テキスト全体を補正
        
        栄養素名、単位、数値パターンを順番に補正します。
        """
        result = text
        
        # 栄養素名の補正
        for wrong, correct in cls.NUTRIENT_NAME_CORRECTIONS.items():
            result = result.replace(wrong, correct)
        
        # 単位の補正
        for wrong, correct in cls.UNIT_CORRECTIONS.items():
            result = result.replace(wrong, correct)
        
        # 数値+単位パターンの補正
        for pattern, replacement in cls.NUMERIC_UNIT_PATTERNS:
            result = re.sub(pattern, replacement, result)
        
        return result
    
    @classmethod
    def correct_nutrient_text(cls, text: str) -> str:
        """
        栄養素名の誤認識を補正（後方互換性のため残す）
        """
        return cls.correct_text(text)
    
    @classmethod
    def correct_numeric_value(cls, text: str) -> str:
        """
        数値部分の誤認識を補正
        
        数値が期待される文脈（単位の前など）でのみ適用します。
        """
        result = []
        for char in text:
            if char in cls.NUMERIC_CORRECTIONS:
                result.append(cls.NUMERIC_CORRECTIONS[char])
            else:
                result.append(char)
        return ''.join(result)
    
    @classmethod
    def extract_numeric_value(cls, text: str) -> Optional[float]:
        """
        テキストから数値を抽出（誤認識補正付き）
        
        「49kcal」「3.3g」「O.6g」「53』」などから数値部分を抽出します。
        OCR誤認識を考慮し、数値部分のみを補正してから抽出します。
        """
        # まずテキスト全体を補正
        corrected_text = cls.correct_text(text)
        
        # 数値パターンを見つける（小数点、誤認識文字を含む）
        patterns = [
            r'([0-9]+\.?[0-9]*)',  # 通常の数値
            r'([0-9OoQDlI|]+\.?[0-9OoQDlI|]*)',  # 誤認識文字を含む
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, corrected_text)
            
            for match in matches:
                # 数値補正を適用
                corrected = cls.correct_numeric_value(match)
                # カンマを除去、全角ピリオドを半角に
                corrected = corrected.replace(',', '').replace('。', '.').replace('、', '')
                
                try:
                    value = float(corrected)
                    # 妥当な範囲チェック（栄養素値として）
                    if 0 <= value <= 10000:
                        return value
                except ValueError:
                    continue
        
        return None


# =============================================================================
# 適応的画像前処理クラス
# =============================================================================

class AdaptiveImagePreprocessor:
    """
    適応的画像前処理
    
    画像の特性を分析し、最適な前処理を
    自動的に選択・適用する。
    
    主要機能:
    1. 色反転検出・自動補正（赤背景白文字など）
    2. 傾き検出・補正（Hough変換）
    3. シャープ化フィルタ（文字のエッジを強調）
    4. コントラスト自動調整（CLAHE）
    5. ノイズ除去（バイラテラルフィルタ）
    
    注意：画像拡大処理はフロントエンドで実施済みのため、
    バックエンドでは行わない
    """
    
    @staticmethod
    def sharpen_image(image: np.ndarray) -> np.ndarray:
        """
        シャープ化フィルタを適用
        
        文字のエッジを強調することで、OCRの認識精度を向上。
        """
        # シャープ化カーネル
        kernel = np.array([
            [-1, -1, -1],
            [-1,  9, -1],
            [-1, -1, -1]
        ])
        sharpened = cv2.filter2D(image, -1, kernel)
        
        # 強すぎるシャープ化を避けるため、元画像とブレンド
        blended = cv2.addWeighted(image, 0.3, sharpened, 0.7, 0)
        
        return blended
    
    @staticmethod
    def detect_inverted_colors(image: np.ndarray) -> bool:
        """
        色反転（暗い背景に明るい文字）を検出
        """
        # グレースケール変換
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
        
        # 画像の平均輝度を計算
        mean_brightness = np.mean(gray)
        
        # 暗い背景（平均輝度が低い）の場合は反転が必要
        return mean_brightness < 100
    
    @staticmethod
    def detect_red_background(image: np.ndarray) -> bool:
        """
        赤系背景を検出
        """
        if len(image.shape) != 3:
            return False
        
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # 赤色の範囲（HSV）
        # 赤は色相が0付近と180付近に分かれる
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        lower_red2 = np.array([170, 50, 50])
        upper_red2 = np.array([180, 255, 255])
        
        mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
        mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
        red_mask = mask1 + mask2
        
        # 赤い領域の割合を計算
        red_ratio = np.sum(red_mask > 0) / (image.shape[0] * image.shape[1])
        
        return red_ratio > 0.25
    
    @staticmethod
    def correct_skew(image: np.ndarray) -> np.ndarray:
        """
        傾き補正
        
        Hough変換で直線を検出し、支配的な角度から画像の傾きを推定。
        """
        # エッジ検出
        edges = cv2.Canny(image, 50, 150, apertureSize=3)
        
        # Hough変換で直線検出
        lines = cv2.HoughLinesP(
            edges, 1, np.pi/180, 
            threshold=100, 
            minLineLength=50, 
            maxLineGap=10
        )
        
        if lines is None or len(lines) == 0:
            return image
        
        # 各直線の角度を計算
        angles = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if x2 - x1 != 0:
                angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                # 水平に近い線のみ考慮（±45度以内）
                if abs(angle) < 45:
                    angles.append(angle)
        
        if not angles:
            return image
        
        # 中央値を使用（外れ値に強い）
        median_angle = np.median(angles)
        
        # 小さな傾き（0.5度未満）は補正しない
        if abs(median_angle) < 0.5:
            return image
        
        # 回転補正
        h, w = image.shape[:2]
        center = (w // 2, h // 2)
        rotation_matrix = cv2.getRotationMatrix2D(center, median_angle, 1.0)
        rotated = cv2.warpAffine(
            image, rotation_matrix, (w, h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_REPLICATE
        )
        
        logger.info(f"Skew corrected: {median_angle:.2f} degrees")
        return rotated
    
    @classmethod
    def preprocess(cls, image_path: str) -> np.ndarray:
        """
        適応的前処理
        
        処理フロー:
        1. 画像読み込み
        2. 色反転検出・補正
        3. グレースケール変換
        4. 傾き補正
        5. シャープ化
        6. ノイズ除去
        7. コントラスト調整
        
        注意：画像拡大はフロントエンドで実施済みのため行わない
        """
        # 画像読み込み
        img = cv2.imread(str(image_path))
        if img is None:
            raise ValueError(f"Failed to load image: {image_path}")
        
        logger.info(f"Image loaded: {img.shape} (upscaling skipped - done in frontend)")
        
        # 赤背景検出と色反転
        if cls.detect_red_background(img):
            logger.info("Red background detected - applying special processing")
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.bitwise_not(gray)
        elif cls.detect_inverted_colors(img):
            logger.info("Inverted colors detected - applying inversion")
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            gray = cv2.bitwise_not(gray)
        else:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # 傾き補正
        gray = cls.correct_skew(gray)
        
        # シャープ化（文字のエッジを強調）
        gray = cls.sharpen_image(gray)
        
        # ノイズ除去（バイラテラルフィルタ：エッジを保持しつつノイズ除去）
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        
        # コントラスト調整（CLAHE）
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)
        
        logger.info(f"Adaptive preprocessing completed. Output size: {enhanced.shape}")
        return enhanced


# =============================================================================
# 意味ブロック形成クラス
# =============================================================================

class SemanticBlockBuilder:
    """
    意味ブロック形成
    
    OCRで検出された個々のテキストボックスを、空間的な近接性に基づいて
    グループ化します。これにより「エネルギー」と「49kcal」のように
    関連するテキストが一つのブロックとしてまとまります。
    
    クラスタリングにはDBSCANを使用します。DBSCANは事前にクラスタ数を
    指定する必要がなく、密度ベースでグループ化できるため、
    栄養成分表示のような不規則なレイアウトに適しています。
    """
    
    def __init__(self, eps_ratio: float = 0.05):
        """
        Args:
            eps_ratio: クラスタリングの距離閾値（画像高さに対する比率）
                      デフォルト0.05は画像高さの5%
        """
        self.eps_ratio = eps_ratio
    
    def build_blocks(
        self, 
        text_boxes: List[TextBox], 
        image_height: int
    ) -> List[SemanticBlock]:
        """
        テキストボックスから意味ブロックを形成
        
        処理:
        1. 各テキストボックスの中心座標を取得
        2. DBSCANで空間的クラスタリング
        3. 同一クラスタのボックスを意味ブロックとしてグループ化
        4. ブロックを左上→右下の順序でソート
        """
        if not text_boxes:
            return []
        
        # 距離閾値を画像サイズに基づいて設定
        eps = image_height * self.eps_ratio
        
        # 中心座標の配列を作成
        centers = np.array([
            [box.center_x, box.center_y] for box in text_boxes
        ])
        
        # DBSCANクラスタリング
        # min_samples=1: 単独のテキストもブロックとして扱う
        clustering = DBSCAN(eps=eps, min_samples=1).fit(centers)
        labels = clustering.labels_
        
        # クラスタごとにテキストボックスをグループ化
        clusters: Dict[int, List[TextBox]] = {}
        for box, label in zip(text_boxes, labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(box)
        
        # 意味ブロックを作成
        blocks = [SemanticBlock(boxes) for boxes in clusters.values()]
        
        # 左上→右下の順序でソート
        # Y座標を一定の高さでグループ化し、その中でX座標でソート
        row_height = image_height * 0.1  # 行の高さとして画像高さの10%を使用
        blocks.sort(key=lambda b: (
            int(b.top_left_y / row_height),  # 行番号
            b.top_left_x  # X座標
        ))
        
        logger.info(f"Built {len(blocks)} semantic blocks from {len(text_boxes)} text boxes")
        return blocks


# =============================================================================
# 栄養素抽出クラス
# =============================================================================

class NutritionExtractor:
    """
    意味ブロックから栄養素情報を抽出
    """
    NUTRIENT_PATTERNS = {
        'calories': [
            r'(?:エネルギー|熱量|カロリー)[:\s：]*([0-9OoQDlI|.,]+)\s*(?:kcal|キロカロリー|㎉)',
            r'(?:エネルギー|熱量|カロリー)[:\s：]*([0-9OoQDlI|.,]+)',
            r'([0-9OoQDlI|.,]+)\s*(?:kcal|キロカロリー|㎉)',
        ],
        'protein': [
            r'(?:たんぱく質|タンパク質|蛋白質|たん白質)[:\s：]*([0-9OoQDlI|.,]+)\s*g',
            r'(?:たんぱく質|タンパク質|蛋白質|たん白質)[:\s：]*([0-9OoQDlI|.,]+)',
        ],
        'fat': [
            r'脂質[:\s：]*([0-9OoQDlI|.,]+)\s*g',
            r'脂質[:\s：]*([0-9OoQDlI|.,]+)',
        ],
        'carbohydrates': [
            r'炭水化物[:\s：]*([0-9OoQDlI|.,]+)\s*g',
            r'炭水化物[:\s：]*([0-9OoQDlI|.,]+)',
        ],
        'sugar': [
            r'(?:糖質|糖類)[:\s：]*([0-9OoQDlI|.,]+)\s*g',
            r'(?:糖質|糖類)[:\s：]*([0-9OoQDlI|.,]+)',
        ],
        'dietary_fiber': [
            r'食物繊維[:\s：]*([0-9OoQDlI|.,]+)\s*g',
            r'食物繊維[:\s：]*([0-9OoQDlI|.,]+)',
        ],
        'sodium': [
            r'食塩相当量[:\s：]*([0-9OoQDlI|.,]+)\s*g',
            r'ナトリウム[:\s：]*([0-9OoQDlI|.,]+)\s*mg',
            r'Na[:\s：]*([0-9OoQDlI|.,]+)\s*mg',
        ],
        'calcium': [
            r'カルシウム[:\s：]*([0-9OoQDlI|.,]+)\s*mg',
            r'Ca[:\s：]*([0-9OoQDlI|.,]+)\s*mg',
        ],
        'iron': [
            r'鉄[:\s：]*([0-9OoQDlI|.,]+)\s*mg',
            r'Fe[:\s：]*([0-9OoQDlI|.,]+)\s*mg',
        ],
        'vitamin_a': [
            r'ビタミン[AＡ][:\s：]*([0-9OoQDlI|.,]+)\s*(?:μg|mcg|ug)',
        ],
        'vitamin_b1': [
            r'ビタミン[BＢ][1１][:\s：]*([0-9OoQDlI|.,]+)\s*mg',
        ],
        'vitamin_b2': [
            r'ビタミン[BＢ][2２][:\s：]*([0-9OoQDlI|.,]+)\s*mg',
        ],
        'vitamin_c': [
            r'ビタミン[CＣ][:\s：]*([0-9OoQDlI|.,]+)\s*mg',
        ],
    }
    
    def __init__(self):
        self.post_processor = OCRPostProcessor()
    
    def extract_from_blocks(
        self, 
        blocks: List[SemanticBlock]
    ) -> Dict[str, Optional[float]]:
        """
        意味ブロックリストから栄養素情報を抽出
        
        各ブロックを順番に処理し、栄養素パターンにマッチするものを抽出。
        同じ栄養素が複数回検出された場合は、最初に検出された値を採用。
        
        """
        nutrition: Dict[str, Optional[float]] = {
            'calories': None,
            'protein': None,
            'fat': None,
            'carbohydrates': None,
            'sugar': None,
            'dietary_fiber': None,
            'sodium': None,
            'calcium': None,
            'iron': None,
            'vitamin_a': None,
            'vitamin_b1': None,
            'vitamin_b2': None,
            'vitamin_c': None,
        }
        
        for block in blocks:
            # テキストの前処理（誤認識補正）
            text = self.post_processor.correct_text(block.combined_text)
            logger.debug(f"Processing block: '{block.combined_text}' -> '{text}'")
            
            # インライン形式の分割処理
            # 「熱量16kcal、たんぱく質1.6g」→ 個別に処理
            sub_texts = self._split_inline_text(text)
            
            for sub_text in sub_texts:
                self._extract_from_text(sub_text, nutrition)
        
        return nutrition
    
    def _split_inline_text(self, text: str) -> List[str]:
        """
        インライン形式のテキストを分割
        
        「熱量16kcal、たんぱく質1.6g、脂質0g」のようなテキストを
        読点やカンマで分割し、個別に処理。
        """
        parts = re.split(r'[、，,]', text)
        
        return [p.strip() for p in parts if p.strip()]
    
    def _extract_from_text(
        self, 
        text: str, 
        nutrition: Dict[str, Optional[float]]
    ) -> None:
        """
        テキストから栄養素を抽出して辞書を更新
        """
        for nutrient, patterns in self.NUTRIENT_PATTERNS.items():
            # 既に値がある場合はスキップ
            if nutrition[nutrient] is not None:
                continue
            
            for pattern in patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    value_text = match.group(1)
                    value = self.post_processor.extract_numeric_value(value_text)
                    
                    if value is not None:
                        nutrition[nutrient] = value
                        logger.debug(f"Extracted {nutrient}: {value} from '{text}'")
                        break


# =============================================================================
# 整合性検証クラス
# =============================================================================

class NutritionValidator:
    """
    栄養素間の整合性検証
    
    検証項目:
    1. エネルギー計算式: kcal ≒ たんぱく質×4 + 脂質×9 + 炭水化物×4
    2. 合計検証: 炭水化物 ≒ 糖質 + 食物繊維
    3. 範囲検証: 各栄養素が妥当な範囲内か
    """
    
    @staticmethod
    def validate(nutrition: Dict[str, Optional[float]]) -> Dict[str, Any]:
        """
        栄養素データの整合性を検証
        """
        warnings = []
        
        # エネルギー計算式検証
        calories = nutrition.get('calories')
        protein = nutrition.get('protein')
        fat = nutrition.get('fat')
        carbs = nutrition.get('carbohydrates')
        
        calculated_calories = None
        if protein is not None and fat is not None and carbs is not None:
            # Atwater係数: たんぱく質4, 脂質9, 炭水化物4
            calculated_calories = protein * 4 + fat * 9 + carbs * 4
            
            if calories is not None and calculated_calories > 0:
                ratio = calories / calculated_calories
                
                # 20%以上の乖離がある場合は警告
                if ratio < 0.8 or ratio > 1.2:
                    warnings.append({
                        'type': 'energy_mismatch',
                        'message': f'カロリー値に不整合の可能性があります。'
                                   f'表示: {calories}kcal, 計算値: {calculated_calories:.0f}kcal',
                        'ratio': ratio
                    })
        
        # 炭水化物 = 糖質 + 食物繊維 の検証
        sugar = nutrition.get('sugar')
        fiber = nutrition.get('dietary_fiber')
        
        if carbs is not None and sugar is not None and fiber is not None:
            expected_carbs = sugar + fiber
            if abs(carbs - expected_carbs) > 1.0:
                warnings.append({
                    'type': 'carbs_mismatch',
                    'message': f'炭水化物の内訳に不整合の可能性があります。'
                               f'炭水化物: {carbs}g, 糖質+食物繊維: {expected_carbs}g'
                })
        
        # 範囲検証（100gあたりの一般的な範囲）
        range_checks = {
            'calories': (0, 900),  # 脂肪100%でも900kcal程度
            'protein': (0, 100),
            'fat': (0, 100),
            'carbohydrates': (0, 100),
        }
        
        for nutrient, (min_val, max_val) in range_checks.items():
            value = nutrition.get(nutrient)
            if value is not None and (value < min_val or value > max_val):
                warnings.append({
                    'type': 'range_error',
                    'message': f'{nutrient}の値が異常です: {value}'
                })
        
        return {
            'is_valid': len(warnings) == 0,
            'warnings': warnings,
            'calculated_calories': calculated_calories
        }


# =============================================================================
# メインOCRプロセッサクラス
# =============================================================================

class NutritionOCRProcessor:
    """
    栄養成分表示OCRプロセッサ
    
    栄養成分表示画像からの情報抽出の全体フローを管理。
    
    処理フロー:
    1. 適応的前処理（色反転、傾き補正、シャープ化など）
    2. EasyOCRによるテキスト検出（位置情報付き）
    3. 意味ブロック形成（空間的クラスタリング）
    4. 栄養素ペア抽出（パターンマッチング）
    5. 後処理補正（誤認識修正）
    6. 整合性検証
    """
    
    def __init__(self, gpu: bool = False):
        self._reader = None  # 遅延初期化
        self._gpu = gpu
        self.preprocessor = AdaptiveImagePreprocessor()
        self.block_builder = SemanticBlockBuilder()
        self.extractor = NutritionExtractor()
        self.validator = NutritionValidator()
        
        logger.info("NutritionOCRProcessor initialized (lazy loading enabled)")
    
    @property
    def reader(self):
        """
        EasyOCRリーダーの遅延初期化
        """
        if self._reader is None:
            import easyocr
            logger.info("Initializing EasyOCR reader (this may take a moment)...")
            self._reader = easyocr.Reader(
                ['ja', 'en'],
                gpu=self._gpu,
                verbose=False
            )
            logger.info("EasyOCR reader initialized")
        return self._reader
    
    def extract_text_with_positions(
        self, 
        image: np.ndarray
    ) -> Tuple[List[TextBox], int]:
        """
        EasyOCRでテキストと位置情報を抽出
        """
        # EasyOCR実行
        results = self.reader.readtext(
            image, 
            detail=1,
            paragraph=False,      # 個別の単語を検出
            min_size=10,          # 小さい文字も検出
            text_threshold=0.5,   # テキスト検出の閾値
            low_text=0.3,         # 低コントラストテキストも検出
            contrast_ths=0.3,     # コントラスト閾値を下げる
            adjust_contrast=0.7,  # コントラスト自動調整
        )
        
        # デバッグ: 全検出結果をログ出力
        logger.info(f"EasyOCR raw results count: {len(results)}")
        for i, (bbox, text, confidence) in enumerate(results):
            logger.info(f"  [{i}] conf={confidence:.3f} text='{text}'")
        
        text_boxes = []
        for bbox, text, confidence in results:
            # 閾値を0.1に下げる（後処理で補正するため）
            if confidence < 0.1:
                logger.debug(f"Skipped low confidence: '{text}' ({confidence:.3f})")
                continue
            if not text.strip():
                continue
            
            text_boxes.append(TextBox(
                text=text.strip(),
                bbox=bbox,
                confidence=confidence
            ))
        
        logger.info(f"Detected {len(text_boxes)} text boxes (after filtering)")
        return text_boxes, image.shape[0]
    
    def process_nutrition_label(self, image_path: str) -> Dict[str, Any]:
        """
        栄養成分表示画像を処理してデータを返す
        """
        try:
            # 1. 適応的前処理（拡大なし - フロントエンドで実施済み）
            preprocessed = self.preprocessor.preprocess(image_path)
            
            # 2. テキスト検出
            text_boxes, image_height = self.extract_text_with_positions(preprocessed)
            
            if not text_boxes:
                return {
                    'success': False,
                    'error': 'テキストを検出できませんでした。画像が不鮮明な可能性があります。',
                    'nutrition': None
                }
            
            # 3. 意味ブロック形成
            blocks = self.block_builder.build_blocks(text_boxes, image_height)
            
            # 4. 栄養素抽出
            nutrition = self.extractor.extract_from_blocks(blocks)
            
            # 5. 整合性検証
            validation = self.validator.validate(nutrition)
            
            # 最低限の栄養素が検出されたかチェック
            has_basic_nutrition = any([
                nutrition.get('calories'),
                nutrition.get('protein'),
                nutrition.get('fat'),
                nutrition.get('carbohydrates')
            ])
            
            if not has_basic_nutrition:
                return {
                    'success': False,
                    'error': '栄養素情報を検出できませんでした。'
                             '栄養成分表示が明確に写っているか確認してください。',
                    'nutrition': nutrition,
                    'detected_texts': [box.text for box in text_boxes[:10]]
                }
            
            # None値を0.0に変換（APIレスポンス用）
            nutrition_cleaned = {
                k: v if v is not None else 0.0 
                for k, v in nutrition.items()
            }
            
            return {
                'success': True,
                'nutrition': nutrition_cleaned,
                'validation': validation,
                'detected_texts': [box.text for box in text_boxes[:10]]
            }
            
        except Exception as e:
            logger.exception(f"OCR processing error: {str(e)}")
            return {
                'success': False,
                'error': f'処理中にエラーが発生しました: {str(e)}',
                'nutrition': None
            }


# =============================================================================
# 後方互換性のためのエイリアス
# =============================================================================

# 既存コードとの互換性を維持するため、旧クラス名でもアクセス可能に
OCRProcessor = NutritionOCRProcessor