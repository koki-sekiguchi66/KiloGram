# record_app/serializers.py
from rest_framework import serializers
from .models import MealRecord, WeightRecord, StandardFood, CustomFood
from django.contrib.auth.models import User

class MealRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealRecord
        fields = [
            'id', 'user', 'record_date', 'meal_timing', 'meal_name',
            'calories', 'protein', 'fat', 'carbohydrates',
            'dietary_fiber', 'sodium', 'calcium', 'iron',
            'vitamin_a', 'vitamin_b1', 'vitamin_b2', 'vitamin_c',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('user', 'id', 'created_at', 'updated_at')

class WeightRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightRecord
        fields = '__all__'
        read_only_fields = ('user', 'id', 'created_at', 'updated_at')

class StandardFoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandardFood
        fields = '__all__'

class CustomFoodSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomFood
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class UserRegistrationSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(style={'input_type': 'password'}, write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("パスワードが一致しません。")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        return user