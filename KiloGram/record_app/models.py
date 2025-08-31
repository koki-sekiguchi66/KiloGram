from django.db import models
from django.contrib.auth.models import User
from datetime import date

class MealRecord(models.Model):
    MEAL_TIMING_CHOICES = [
        ('breakfast', '朝食'),
        ('lunch', '昼食'),
        ('dinner', '夕食'),
        ('snack', '間食'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='ユーザー')
    record_date = models.DateField(verbose_name='日付', default=date.today)
    meal_timing = models.CharField(max_length=10, choices=MEAL_TIMING_CHOICES, verbose_name='食事タイミング')
    meal_name = models.CharField(max_length=100, verbose_name='食事名')

    #基本栄養情報
    calories = models.FloatField(default=0.0, verbose_name='カロリー(kcal)')
    protein = models.FloatField(default=0.0, verbose_name="タンパク質(g)")
    fat = models.FloatField(default=0.0, verbose_name="脂質(g)")
    carbohydrates = models.FloatField(default=0.0, verbose_name="炭水化物(g)")

    #詳細栄養情報
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

class WeightRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='ユーザー')
    record_date = models.DateField(verbose_name='日付', default=date.today)
    weight = models.FloatField(verbose_name='体重(kg)')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    def __str__(self):
        return f"{self.user.username} - {self.record_date} : {self.weight}kg"

    class Meta:
        verbose_name = "体重記録"
        verbose_name_plural = "体重記録"

class StandardFood(models.Model):
    """文科省食品標準成分表の食品情報"""

    food_number = models.CharField(max_length=10, unique=True, verbose_name="食品番号")
    name = models.CharField(max_length=100, verbose_name="食品名")
    category = models.CharField(max_length=50, verbose_name="分類")
    
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

class CustomFood(models.Model):
    """ユーザーが追加した食品情報"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
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
        return f"{self.user.username} - {self.name}"

    class Meta:
        verbose_name = "カスタム食品"
        verbose_name_plural = "カスタム食品"
        unique_together = ['user', 'name']

