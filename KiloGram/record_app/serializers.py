from rest_framework import serializers
from .models import MealRecord, WeightRecord
from django.contrib.auth.models import User

class MealRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MealRecord
        fields = '__all__'
        read_only_fields = ('user', 'record_date')

class WeightRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightRecord
        fields = '__all__'
        read_only_fields = ('user', 'record_date')


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


    