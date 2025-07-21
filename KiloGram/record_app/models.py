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
    calories = models.FloatField(default=0.0, verbose_name='カロリー(kcal)')
    protein = models.FloatField(default=0.0, verbose_name="タンパク質(g)")
    fat = models.FloatField(default=0.0, verbose_name="脂質(g)")
    carbohydrates = models.FloatField(default=0.0, verbose_name="炭水化物(g)")
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

