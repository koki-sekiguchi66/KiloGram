from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.indexes import GinIndex
from datetime import date



class MealRecord(models.Model):
    """ユーザーの食事記録"""
    MEAL_TIMING_CHOICES = [
        ('breakfast', '朝食'),
        ('lunch', '昼食'),
        ('dinner', '夕食'),
        ('snack', '間食'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='ユーザー')
    record_date = models.DateField(verbose_name='日付', default=date.today, db_index=True)
    meal_timing = models.CharField(max_length=10, choices=MEAL_TIMING_CHOICES, verbose_name='食事タイミング')
    meal_name = models.CharField(max_length=100, verbose_name='食事名')

    # 基本栄養情報
    calories = models.FloatField(default=0.0, verbose_name='カロリー(kcal)')
    protein = models.FloatField(default=0.0, verbose_name="タンパク質(g)")
    fat = models.FloatField(default=0.0, verbose_name="脂質(g)")
    carbohydrates = models.FloatField(default=0.0, verbose_name="炭水化物(g)")

    # 詳細栄養情報
    dietary_fiber = models.FloatField(default=0.0, verbose_name="食物繊維(g)")
    sodium = models.FloatField(default=0.0, verbose_name="ナトリウム(mg)")
    calcium = models.FloatField(default=0.0, verbose_name="カルシウム(mg)")
    iron = models.FloatField(default=0.0, verbose_name="鉄分(mg)")
    vitamin_a = models.FloatField(default=0.0, verbose_name="ビタミンA(μg)")
    vitamin_b1 = models.FloatField(default=0.0, verbose_name="ビタミンB1(mg)")
    vitamin_b2 = models.FloatField(default=0.0, verbose_name="ビタミンB2(mg)")
    vitamin_c = models.FloatField(default=0.0, verbose_name="ビタミンC(mg)")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"{self.record_date} - {self.get_meal_timing_display()} - {self.meal_name}"
    
    class Meta:
        verbose_name = "食事記録"
        verbose_name_plural = "食事記録"
        indexes = [
            models.Index(fields=['user', 'record_date'], name='meal_user_date_idx'),
            models.Index(fields=['user', 'meal_timing'], name='meal_user_timing_idx'),
            models.Index(fields=['-created_at'], name='meal_created_desc_idx'),
        ]
        ordering = ['-record_date', '-created_at']


class WeightRecord(models.Model):
    """ユーザーの体重記録"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='ユーザー')
    record_date = models.DateField(verbose_name='日付', default=date.today, db_index=True)
    weight = models.FloatField(verbose_name='体重(kg)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"{self.user.username} - {self.record_date} : {self.weight}kg"

    class Meta:
        verbose_name = "体重記録"
        verbose_name_plural = "体重記録"
        indexes = [
            models.Index(fields=['user', 'record_date'], name='weight_user_date_idx'),
            models.Index(fields=['user', '-record_date'], name='weight_user_date_desc_idx'),
        ]
        ordering = ['-record_date']


class StandardFood(models.Model):
    """文科省食品標準成分表の食品情報"""

    food_number = models.CharField(max_length=10, unique=True, verbose_name="食品番号")
    name = models.CharField(max_length=100, verbose_name="食品名", db_index=True)
    category = models.CharField(max_length=50, verbose_name="分類", db_index=True)
    
    # 100gあたりの栄養成分
    calories_per_100g = models.FloatField(verbose_name="エネルギー(kcal)")
    protein_per_100g = models.FloatField(verbose_name="たんぱく質(g)")
    fat_per_100g = models.FloatField(verbose_name="脂質(g)")
    carbs_per_100g = models.FloatField(verbose_name="炭水化物(g)")
    fiber_per_100g = models.FloatField(default=0, verbose_name="食物繊維(g)")
    sodium_per_100g = models.FloatField(default=0, verbose_name="ナトリウム(mg)")
    calcium_per_100g = models.FloatField(default=0, verbose_name="カルシウム(mg)")
    iron_per_100g = models.FloatField(default=0, verbose_name="鉄(mg)")
    vitamin_a_per_100g = models.FloatField(default=0, verbose_name="ビタミンA(μg)")
    vitamin_b1_per_100g = models.FloatField(default=0, verbose_name="ビタミンB1(mg)")
    vitamin_b2_per_100g = models.FloatField(default=0, verbose_name="ビタミンB2(mg)")
    vitamin_c_per_100g = models.FloatField(default=0, verbose_name="ビタミンC(mg)")
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "標準食品"
        verbose_name_plural = "標準食品"
        indexes = [
            GinIndex(fields=['name'], name='standardfood_name_gin_idx', opclasses=['gin_trgm_ops']),
            models.Index(fields=['category', 'name'], name='standardfood_cat_name_idx'),
            models.Index(fields=['category'], name='standardfood_category_idx'),
        ]
        ordering = ['category', 'name']


class CustomFood(models.Model):
    """ユーザーが追加した食品情報"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100, db_index=True)
    
    # 100gあたりの栄養成分
    calories_per_100g = models.FloatField(verbose_name="エネルギー(kcal)")
    protein_per_100g = models.FloatField(verbose_name="たんぱく質(g)")
    fat_per_100g = models.FloatField(verbose_name="脂質(g)")
    carbs_per_100g = models.FloatField(verbose_name="炭水化物(g)")
    fiber_per_100g = models.FloatField(default=0, verbose_name="食物繊維(g)")
    sodium_per_100g = models.FloatField(default=0, verbose_name="ナトリウム(mg)")
    calcium_per_100g = models.FloatField(default=0, verbose_name="カルシウム(mg)")
    iron_per_100g = models.FloatField(default=0, verbose_name="鉄(mg)")
    vitamin_a_per_100g = models.FloatField(default=0, verbose_name="ビタミンA(μg)")
    vitamin_b1_per_100g = models.FloatField(default=0, verbose_name="ビタミンB1(mg)")
    vitamin_b2_per_100g = models.FloatField(default=0, verbose_name="ビタミンB2(mg)")
    vitamin_c_per_100g = models.FloatField(default=0, verbose_name="ビタミンC(mg)")

    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"{self.user.username} - {self.name}"

    class Meta:
        verbose_name = "カスタム食品"
        verbose_name_plural = "カスタム食品"
        unique_together = ['user', 'name']
        indexes = [
            models.Index(fields=['user', 'name'], name='customfood_user_name_idx'),
            models.Index(fields=['user'], name='customfood_user_idx'),
        ]
        ordering = ['user', 'name']


class CafeteriaMenu(models.Model):
    """食堂メニュー情報"""
    
    MENU_CATEGORY = [
        ('main', '主菜'),
        ('side', '副菜'),
        ('noodle', '麺類'),
        ('rice', '丼・カレー'),
        ('dessert', 'デザート'),
        ('order', 'オーダー'),
        ('kebab', 'ケバブ＆ベジタリアン'),
        ('parfait', 'パフェ'),
        ('night', '夜限定'),
        ('other', 'その他'),
    ]
    
    menu_id = models.CharField(max_length=20, unique=True, verbose_name='メニューID')
    name = models.CharField(max_length=200, verbose_name='メニュー名', db_index=True)
    category = models.CharField(max_length=20, choices=MENU_CATEGORY, verbose_name='カテゴリー', db_index=True)
    
    # 栄養成分
    calories = models.FloatField(verbose_name='エネルギー(kcal)')
    protein = models.FloatField(verbose_name='タンパク質(g)')
    fat = models.FloatField(verbose_name='脂質(g)')
    carbohydrates = models.FloatField(verbose_name='炭水化物(g)')
    dietary_fiber = models.FloatField(default=0, verbose_name='食物繊維(g)')
    sodium = models.FloatField(default=0, verbose_name='食塩相当量(g)')
    calcium = models.FloatField(default=0, verbose_name='カルシウム(mg)')
    iron = models.FloatField(default=0, verbose_name='鉄(mg)')
    vitamin_a = models.FloatField(default=0, verbose_name='ビタミンA(μg)')
    vitamin_b1 = models.FloatField(default=0, verbose_name='ビタミンB1(mg)')
    vitamin_b2 = models.FloatField(default=0, verbose_name='ビタミンB2(mg)')
    vitamin_c = models.FloatField(default=0, verbose_name='ビタミンC(mg)')
    
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新日時')
    
    class Meta:
        verbose_name = '食堂メニュー'
        verbose_name_plural = '食堂メニュー'
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['category'], name='cafeteria_category_idx'),
            models.Index(fields=['category', 'name'], name='cafeteria_cat_name_idx'),
            models.Index(fields=['updated_at'], name='cafeteria_updated_idx'),
            # 名前での検索用GINインデックス（オプション - 検索が遅い場合に有効化）
            # GinIndex(fields=['name'], name='cafeteria_name_gin_idx', opclasses=['gin_trgm_ops']),
        ]
    
    def __str__(self):
        return f"{self.get_category_display()} - {self.name}"